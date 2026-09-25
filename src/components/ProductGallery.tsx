"use client";

import { useState } from "react";
import ProductArt from "@/components/ProductArt";

export default function ProductGallery({ product, images }: { product: { name: string; theme: string; coverImage: string | null }; images: { id: string; url: string }[] }) {
  const [selected, setSelected] = useState(0);
  const entries = [{ id: "cover", type: "cover", url: "" }, { id: "sample", type: "sample", url: "" }, ...images.map((image) => ({ id: image.id, type: "image", url: image.url }))];
  function preview(type: string, url: string, small = false) {
    if (type === "cover") return <ProductArt product={product} large={!small} />;
    if (type === "image") return <img src={url} alt={`Preview page from ${product.name}`} />;
    return <div className="preview-page"><h4>A moment to pause.</h4><p>How am I really feeling today?</p><div className="preview-lines"><i /><i /><i /><i /><i /></div><p style={{ marginTop: 28 }}>One small thing I need right now...</p><div className="preview-lines"><i /><i /></div></div>;
  }
  return <div><div className="detail-main-art">{preview(entries[selected].type, entries[selected].url)}</div><div className="preview-thumbs">{entries.map((entry, index) => <button type="button" className={`preview-thumb ${selected === index ? "active" : ""}`} key={entry.id} onClick={() => setSelected(index)} aria-label={`View preview ${index + 1}`}>{preview(entry.type, entry.url, true)}</button>)}</div><p style={{ color: "#94a093", fontSize: 10, marginTop: 12 }}>✳ &nbsp; Click to peek inside the pages</p></div>;
}
