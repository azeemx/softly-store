"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, BookOpen, Sun, Moon, Maximize2, Minimize2 } from "lucide-react";

export default function ReaderShell({
  title,
  author,
  src,
  backHref,
  backLabel,
  downloadHref,
  sample = false,
  note,
}: {
  title: string;
  author?: string;
  src: string;
  backHref: string;
  backLabel: string;
  downloadHref?: string;
  sample?: boolean;
  note?: string;
}) {
  const [theme, setTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullscreen]);

  const bgStyles = {
    dark: "#232725",
    sepia: "#ebe3d5",
    light: "#f7f7f5",
  };

  return (
    <div
      className="reader-shell"
      style={{
        background: bgStyles[theme],
        position: fullscreen ? "fixed" : "relative",
        inset: fullscreen ? 0 : "auto",
        zIndex: fullscreen ? 100 : "auto",
      }}
    >
      <header className="reader-bar">
        <Link href={backHref} className="reader-back">
          <ArrowLeft size={16} /> <span>{backLabel}</span>
        </Link>
        <div className="reader-title">
          <BookOpen size={16} />
          <div>
            <strong>{title}</strong>
            {author && <small>by {author}</small>}
            {sample && <small className="reader-sample-tag">Free sample</small>}
          </div>
        </div>

        <div className="reader-actions">
          {/* Quick theme toggles for ambient reading comfort */}
          <div style={{ display: "inline-flex", gap: 3, border: "1px solid #dce2d9", borderRadius: 4, padding: 2 }}>
            <button
              type="button"
              className="icon-button"
              style={{ padding: "4px 6px", fontSize: 10, background: theme === "dark" ? "#29483f" : "transparent", color: theme === "dark" ? "#fff" : "inherit" }}
              onClick={() => setTheme("dark")}
              title="Dark ambient theme"
            >
              <Moon size={13} />
            </button>
            <button
              type="button"
              className="icon-button"
              style={{ padding: "4px 6px", fontSize: 10, background: theme === "sepia" ? "#d5c6b0" : "transparent", color: theme === "sepia" ? "#29483f" : "inherit" }}
              onClick={() => setTheme("sepia")}
              title="Warm paper theme"
            >
              <Sun size={13} />
            </button>
          </div>

          <button
            type="button"
            className="button button-small button-outline"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen view"}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span style={{ display: "inline" }}>{fullscreen ? "Exit" : "Expand"}</span>
          </button>

          <a className="button button-small button-outline" href={src} target="_blank" rel="noopener">
            <ExternalLink size={13} /> <span>Open tab</span>
          </a>
          {downloadHref && (
            <a className="button button-small" href={downloadHref}>
              <Download size={13} /> <span>Download PDF</span>
            </a>
          )}
        </div>
      </header>

      {note && <div className="reader-note">{note}</div>}

      <iframe
        className="reader-frame"
        src={`${src}#view=FitH`}
        title={title}
        allow="fullscreen"
      />

      <div className="reader-fallback">
        Tip: On tablets or phones, pinch to zoom or swipe pages. Having trouble?{" "}
        <a href={src} target="_blank" rel="noopener">
          Open in a new tab
        </a>{" "}
        {downloadHref && (
          <>
            or <a href={downloadHref}>download the PDF</a>
          </>
        )}
        .
      </div>
    </div>
  );
}
