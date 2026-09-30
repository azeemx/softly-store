// src/lib/storage.ts
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const privateRoot = join(process.cwd(), "private_uploads");
const mediaRoot = join(process.cwd(), "media_uploads");

// Generated samples / temporary PDFs.
// Important: Vercel filesystem is read-only, so these stay in memory there.
const inlineSamples = new Map<string, Buffer>();

// Preview cache.
const previewCache = new Map<string, Buffer>();

const onVercel = process.env.VERCEL === "1";

function r2Config() {
  const {
    R2_ENDPOINT,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
  } = process.env;

  if (
    !R2_ENDPOINT ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    return null;
  }

  return {
    endpoint: R2_ENDPOINT,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
  };
}

function r2Client(config: NonNullable<ReturnType<typeof r2Config>>) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function localPath(key: string) {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) {
    throw new Error("Invalid storage key");
  }

  return join(privateRoot, key);
}

// ---------------------------------------------------------------------------
// Private PDFs
// ---------------------------------------------------------------------------

export async function savePrivatePdf(buffer: Buffer) {
  const filename = `products/${randomUUID()}.pdf`;
  const config = r2Config();

  if (config) {
    await r2Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: filename,
        Body: buffer,
        ContentType: "application/pdf",
      }),
    );

    return `r2:${filename}`;
  }

  if (onVercel) {
    throw new Error(
      "Private storage is not configured. Set R2_* environment variables to enable uploads in production.",
    );
  }

  const path = localPath(filename);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);

  return `local:${filename}`;
}

export async function readPrivatePdf(storageKey: string) {
  // In-memory generated samples.
  if (storageKey.startsWith("inline:")) {
    const buffer = inlineSamples.get(storageKey.slice(7));

    if (!buffer) {
      throw new Error(
        "Sample expired from cache. Reload the page to rebuild.",
      );
    }

    return buffer;
  }

  // R2.
  if (storageKey.startsWith("r2:")) {
    const config = r2Config();

    if (!config) {
      throw new Error("Private storage is not configured");
    }

    const response = await r2Client(config).send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: storageKey.slice(3),
      }),
    );

    if (!response.Body) {
      throw new Error("File not found");
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  // Local disk.
  if (storageKey.startsWith("local:")) {
    const key = storageKey.slice(6);

    // Local files cannot be read from Vercel.
    // Try R2 as a migration/fallback path.
    if (onVercel) {
      const config = r2Config();

      if (config) {
        try {
          const response = await r2Client(config).send(
            new GetObjectCommand({
              Bucket: config.bucket,
              Key: key,
            }),
          );

          if (response.Body) {
            return Buffer.from(await response.Body.transformToByteArray());
          }
        } catch {
          // Continue to the useful error below.
        }
      }

      throw new Error(
        "This file was generated on local disk and is not available in production. Set up R2 or re-seed the store.",
      );
    }

    return readFile(localPath(key));
  }

  throw new Error("Invalid storage key");
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function saveImage(
  buffer: Buffer,
  extension: "jpg" | "png" | "webp",
) {
  const name = `${randomUUID()}.${extension}`;
  const config = r2Config();

  if (config) {
    await r2Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: `images/${name}`,
        Body: buffer,
        ContentType:
          extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : "image/jpeg",
      }),
    );
  } else {
    if (onVercel) {
      throw new Error(
        "Image storage is not configured. Set R2_* environment variables to enable uploads in production.",
      );
    }

    await mkdir(mediaRoot, { recursive: true });
    await writeFile(join(mediaRoot, name), buffer);
  }

  return name;
}

export async function readImage(name: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) {
    throw new Error("Invalid image name");
  }

  const config = r2Config();

  if (config) {
    try {
      const result = await r2Client(config).send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: `images/${name}`,
        }),
      );

      if (result.Body) {
        return Buffer.from(await result.Body.transformToByteArray());
      }
    } catch {
      // Fall back to local storage.
    }
  }

  if (onVercel) {
    throw new Error("Image not found in R2.");
  }

  return readFile(join(mediaRoot, name));
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

function pdfEscape(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\()]/g, "\\$&");
}

function text(value: string, size: number, x: number, y: number) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET`;
}

function wrap(value: string, maxChars: number) {
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Journal PDF
// ---------------------------------------------------------------------------

const journalPrompts = [
  "How am I feeling right now, beneath the first answer?",
  "What is taking up the most space in my thoughts today?",
  "What would I tell a friend who felt the way I do?",
  "What small thing brought me comfort this week?",
  "What am I ready to make more room for?",
  "Where in my life do I feel most like myself?",
  "What is one thing I can be proud of today?",
  "What have I been carrying that I can set down?",
  "What does rest look like for me right now?",
  "What am I grateful my past self did for me?",
  "What would a gentler day look like?",
  "What is one thought I want to hold onto?",
  "What do I wish someone would ask me?",
  "Where am I growing, even if it feels slow?",
  "What do I need to hear today?",
  "What is a moment I want to remember?",
  "What parts of my routine feel nourishing?",
  "What parts of my routine can I release?",
  "What is one choice I can make from a place of love?",
  "What has surprised me about myself lately?",
  "What would I do if I trusted my own pace?",
  "What is bringing me energy? What is draining it?",
  "Where can I choose curiosity over judgment?",
  "What is a small joy I nearly missed today?",
  "What boundaries would help me feel more at ease?",
  "What story about myself am I ready to rewrite?",
  "What feels important in this season of life?",
  "How can I offer myself more compassion?",
  "What am I learning to say yes to?",
  "What am I learning to say no to?",
  "When did I feel truly present recently?",
  "What do I want my mornings to feel like?",
  "What does enough look like to me today?",
  "Who or what has supported me lately?",
  "What is a dream I can take one small step toward?",
  "What part of myself deserves more attention?",
  "What helped me through a hard moment before?",
  "What am I curious to explore next?",
  "What can I celebrate about the ordinary today?",
  "What would I like to remember a year from now?",
  "What does feeling grounded mean to me?",
  "What is one way I have changed for the better?",
  "What could I forgive myself for?",
  "What makes a day feel meaningful to me?",
  "What is one kind thing I can do for future me?",
  "What do I love about the life I am building?",
  "What feels possible when I slow down?",
  "What intention will I take into tomorrow?",
  "What is a new beginning I am ready to welcome?",
  "What have these pages taught me about myself?",
];

function buildJournalPdf(title: string, pageCount: number) {
  const count = Math.max(2, Math.min(pageCount, 120));

  const pageReferences = Array.from(
    { length: count },
    (_, i) => `${4 + i * 2} 0 R`,
  ).join(" ");

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageReferences}] /Count ${count} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  for (let i = 0; i < count; i++) {
    const intro = i === 0;
    const prompt =
      journalPrompts[(i - 1 + journalPrompts.length) % journalPrompts.length];

    const commands = [
      "0.98 0.97 0.94 rg 0 0 612 792 re f",
      "0.17 0.29 0.25 rg",
      text("softly.", 19, 58, 733),
      "0.79 0.62 0.54 RG 1 w 58 712 m 554 712 l S",
      text(
        intro
          ? "A little space, just for you."
          : `A moment to pause.  ${String(i).padStart(2, "0")}`,
        intro ? 25 : 22,
        58,
        653,
      ),
      text(title, title.length > 33 ? 13 : 16, 58, 617),
    ];

    const body = intro
      ? [
          "Welcome to your journal. There is no right way to begin.",
          "Bring your whole self to these pages. Take your time.",
          "Write a little or a lot. Come back whenever you need.",
          "",
          "Today, I am beginning from...",
        ]
      : wrap(prompt, 63);

    body.forEach((line, lineIndex) => {
      commands.push(
        text(
          line,
          intro ? 13 : 16,
          58,
          552 - lineIndex * (intro ? 29 : 27),
        ),
      );
    });

    const startY =
      intro ? 370 : 465 - Math.max(0, body.length - 1) * 27;

    commands.push("0.81 0.84 0.79 RG 0.6 w");

    for (let line = 0; line < 10; line++) {
      const y = startY - line * 34;

      if (y > 80) {
        commands.push(`58 ${y} m 554 ${y} l S`);
      }
    }

    commands.push(
      "0.48 0.55 0.48 rg",
      text("A page at a time. A little more you.", 9, 58, 41),
      text(`${i + 1} / ${count}`, 9, 520, 41),
    );

    const stream = commands.join("\n") + "\n";
    const contentNumber = 5 + i * 2;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNumber} 0 R >>`,
    );

    objects.push(
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = Buffer.byteLength(pdf);

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf);
}

// ---------------------------------------------------------------------------
// E-book PDF
// ---------------------------------------------------------------------------

const passages = [
  "This placeholder edition was generated automatically so the storefront, checkout, reader, and free-sample features can be explored right away.",
  "Replace this file with the real e-book from the admin panel: open the product, upload the private PDF, and it will be delivered securely to every future reader.",
  "Readers can enjoy purchased books instantly in the online reader, or download the PDF to keep. Free samples show only the first few pages you allow.",
  "There is a quiet kind of courage in beginning a book. Each page is an invitation to slow down, to notice, and to carry something new back into ordinary life.",
  "Stories and ideas travel best when they are shared gently. Keep the ones that move you close, and pass the rest along to someone who might need them.",
];

function buildEbookPdf(
  title: string,
  author: string,
  pageCount: number,
) {
  const count = Math.max(3, Math.min(pageCount, 40));

  const refs = Array.from(
    { length: count },
    (_, i) => `${4 + i * 2} 0 R`,
  ).join(" ");

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${refs}] /Count ${count} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
  ];

  for (let i = 0; i < count; i++) {
    const commands = [
      "0.99 0.98 0.95 rg 0 0 612 792 re f",
      "0.16 0.22 0.2 rg",
    ];

    if (i === 0) {
      wrap(title, 26).forEach((line, index) => {
        commands.push(
          text(line, 34, 72, 520 - index * 42),
        );
      });

      commands.push(
        text(
          author ? `by ${author}` : "softly. editions",
          16,
          72,
          430,
        ),
        "0.79 0.62 0.54 RG 1 w 72 410 m 300 410 l S",
        text(
          "Placeholder edition - replace with your real file in the admin panel.",
          10,
          72,
          380,
        ),
        text("softly. e-books", 11, 72, 72),
      );
    } else {
      commands.push(
        text(`Chapter ${i}`, 22, 72, 700),
        text(title, 10, 72, 680),
      );

      let y = 640;

      for (let p = 0; p < 4; p++) {
        for (const line of wrap(
          passages[(i + p) % passages.length],
          78,
        )) {
          commands.push(text(line, 12, 72, y));
          y -= 19;
        }

        y -= 14;
      }

      commands.push(text(`${i + 1}`, 10, 300, 48));
    }

    const stream = commands.join("\n") + "\n";

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );

    objects.push(
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = Buffer.byteLength(pdf);

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf);
}

// ---------------------------------------------------------------------------
// Sample e-book
// ---------------------------------------------------------------------------

export async function ensureSampleEbookPdf(
  slug: string,
  title: string,
  author: string,
  pages: number,
) {
  const key = `samples/ebooks/${slug}.pdf`;
  const cacheKey = `ebook:${slug}:${pages}`;
  const config = r2Config();

  // R2.
  if (config) {
    let buffer = inlineSamples.get(cacheKey);

    if (!buffer) {
      buffer = buildEbookPdf(title, author, pages);
      inlineSamples.set(cacheKey, buffer);
    }

    try {
      await r2Client(config).send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: "application/pdf",
        }),
      );

      return {
        storageKey: `r2:${key}`,
        sizeBytes: buffer.length,
      };
    } catch {
      // Fall back to memory.
    }
  }

  // Local development.
  if (!onVercel) {
    const path = localPath(key);

    try {
      await stat(path);
    } catch {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(
        path,
        buildEbookPdf(title, author, pages),
      );
    }

    return {
      storageKey: `local:${key}`,
      sizeBytes: (await stat(path)).size,
    };
  }

  // Vercel without R2.
  let buffer = inlineSamples.get(cacheKey);

  if (!buffer) {
    buffer = buildEbookPdf(title, author, pages);
    inlineSamples.set(cacheKey, buffer);
  }

  return {
    storageKey: `inline:${cacheKey}`,
    sizeBytes: buffer.length,
  };
}

// ---------------------------------------------------------------------------
// Sample journal
// ---------------------------------------------------------------------------

export async function ensureSamplePdf(
  slug: string,
  title: string,
  pages: number,
) {
  const key = `samples/v2/${slug}.pdf`;
  const cacheKey = `journal:${slug}:${pages}`;
  const config = r2Config();

  // R2.
  if (config) {
    let buffer = inlineSamples.get(cacheKey);

    if (!buffer) {
      buffer = buildJournalPdf(title, pages);
      inlineSamples.set(cacheKey, buffer);
    }

    try {
      await r2Client(config).send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: "application/pdf",
        }),
      );

      return {
        storageKey: `r2:${key}`,
        sizeBytes: buffer.length,
      };
    } catch {
      // Fall back to memory.
    }
  }

  // Local development.
  if (!onVercel) {
    const path = localPath(key);

    try {
      await stat(path);
    } catch {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(
        path,
        buildJournalPdf(title, pages),
      );
    }

    return {
      storageKey: `local:${key}`,
      sizeBytes: (await stat(path)).size,
    };
  }

  // Vercel without R2.
  let buffer = inlineSamples.get(cacheKey);

  if (!buffer) {
    buffer = buildJournalPdf(title, pages);
    inlineSamples.set(cacheKey, buffer);
  }

  return {
    storageKey: `inline:${cacheKey}`,
    sizeBytes: buffer.length,
  };
}

// ---------------------------------------------------------------------------
// Preview generator
// ---------------------------------------------------------------------------

export async function buildPreviewPdf(
  storageKey: string,
  pages: number,
) {
  const cacheKey = `${storageKey}:${pages}`;

  const cached = previewCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const { PDFDocument } = await import("pdf-lib");

  const source = await PDFDocument.load(
    await readPrivatePdf(storageKey),
    {
      ignoreEncryption: true,
    },
  );

  const preview = await PDFDocument.create();

  const indices = Array.from(
    {
      length: Math.min(
        pages,
        source.getPageCount(),
      ),
    },
    (_, i) => i,
  );

  const copied = await preview.copyPages(
    source,
    indices,
  );

  copied.forEach((page) => {
    preview.addPage(page);
  });

  preview.setTitle("Free sample");

  const bytes = Buffer.from(
    await preview.save(),
  );

  if (previewCache.size > 60) {
    const firstKey = previewCache.keys().next().value;

    if (firstKey) {
      previewCache.delete(firstKey);
    }
  }

  previewCache.set(cacheKey, bytes);

  return bytes;
}

export function invalidatePreview(storageKey: string) {
  for (const key of previewCache.keys()) {
    if (key.startsWith(`${storageKey}:`)) {
      previewCache.delete(key);
    }
  }
}
