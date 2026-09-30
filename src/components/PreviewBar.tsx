"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Upload, X, ExternalLink } from "lucide-react";

// Floating bar shown ONLY to a signed-in admin while previewing unpublished draft
// changes on the live storefront. Publish/Discard apply instantly (no redeploy).
export default function PreviewBar() {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  async function act(mode: "publish" | "discard") {
    setBusy(mode);
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      if (!response.ok) throw new Error((await response.json()).error || "Failed");
      if (mode === "discard") await fetch("/api/admin/preview?off=1");
      router.refresh();
      router.push(mode === "publish" ? "/admin?tab=content" : "/admin?tab=content");
    } catch { setBusy(""); }
  }

  return <div className="preview-bar" role="status">
    <span className="preview-dot" />
    <strong>Preview mode</strong>
    <span className="preview-text">You&apos;re viewing draft changes — visitors still see the live version.</span>
    <div className="preview-actions">
      <button className="button button-small" disabled={!!busy} onClick={() => act("publish")}>
        <Upload size={13} /> {busy === "publish" ? "Publishing..." : "Publish changes"}
      </button>
      <button className="button button-small button-outline" disabled={!!busy} onClick={() => act("discard")}>
        <X size={13} /> {busy === "discard" ? "Discarding..." : "Discard"}
      </button>
      <a className="button button-small button-outline" href="/admin?tab=content"><ExternalLink size={13} /> Dashboard</a>
      <button className="icon-button" title="Exit preview" aria-label="Exit preview" onClick={async () => { await fetch("/api/admin/preview?off=1"); router.refresh(); }}>
        <Eye size={16} />
      </button>
    </div>
  </div>;
}
