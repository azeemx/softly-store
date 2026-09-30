"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, LayoutDashboard, Link2 } from "lucide-react";

type NavItem = { label: string; href: string };
type FooterColumn = { title: string; links: NavItem[] };
type Payload = Record<string, unknown>;

function readNav(value: unknown): NavItem[] {
  if (!Array.isArray(value)) return [];
  return (value as NavItem[]).map((item) => ({ label: String(item.label || ""), href: String(item.href || "") }));
}
function readColumns(value: unknown): FooterColumn[] {
  if (!Array.isArray(value)) return [];
  return (value as FooterColumn[]).map((column) => {
    const links: NavItem[] = Array.isArray(column.links)
      ? column.links.map((link) => ({ label: String(link.label || ""), href: String(link.href || "") }))
      : [];
    return { title: String(column.title || ""), links };
  });
}

/**
 * Navigation + footer link editor. Menu items are stored in the database and
 * rendered live — adding/removing/reordering links needs no code or redeploy.
 */
export function NavEditor({ settings, onSave }: { settings: Record<string, unknown>; onSave: (payload: Payload) => Promise<void> }) {
  const [nav, setNav] = useState<NavItem[]>(() => readNav(settings.navItems));
  const [footer, setFooter] = useState<FooterColumn[]>(() => readColumns(settings.footerLinks));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setNavItem = (i: number, patch: Partial<NavItem>) => setNav((cur) => cur.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const setLink = (c: number, i: number, patch: Partial<NavItem>) => setFooter((cur) => cur.map((column, ci) => (ci === c ? { ...column, links: column.links.map((link, li) => (li === i ? { ...link, ...patch } : link)) } : column)));

  async function save() {
    setSaving(true); setError(""); setSuccess("");
    try {
      await onSave({ navItems: nav.filter((i) => i.label && i.href), footerLinks: footer.filter((c) => c.title) });
      setSuccess("Menu saved to draft. Preview the storefront, then publish.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
    setSaving(false);
  }

  return <div className="admin-form">
    <div className="admin-panel-head" style={{ padding: "0 0 14px", borderBottom: "1px solid #edf0ea" }}><div><h2><Link2 size={15} /> Main menu (header)</h2><p>Shows on desktop and in the mobile menu.</p></div><button className="button button-small button-outline" onClick={() => setNav([...nav, { label: "", href: "" }])}><Plus size={14} /> Add link</button></div>
    {nav.length === 0 && <p className="muted" style={{ fontSize: 11 }}>No menu links — the site will fall back to the default menu.</p>}
    {nav.map((item, index) => <div className="form-grid" key={`nav-${index}`} style={{ gridTemplateColumns: "1fr 1.4fr auto", alignItems: "center" }}>
      <input className="input" value={item.label} placeholder="Label (e.g. Journals)" onChange={(e) => setNavItem(index, { label: e.target.value })} aria-label="Menu label" />
      <input className="input" value={item.href} placeholder="Path (e.g. /shop)" onChange={(e) => setNavItem(index, { href: e.target.value })} aria-label="Menu path" />
      <div className="admin-actions"><button className="admin-icon-btn" title="Move up" disabled={index === 0} onClick={() => setNav((cur) => { const copy = [...cur]; [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]; return copy; })}><ArrowUp size={13} /></button><button className="admin-icon-btn" title="Move down" disabled={index === nav.length - 1} onClick={() => setNav((cur) => { const copy = [...cur]; [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]]; return copy; })}><ArrowDown size={13} /></button><button className="admin-icon-btn danger" title="Remove" onClick={() => setNav((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={13} /></button></div>
    </div>)}

    <div className="admin-panel-head" style={{ padding: "18px 0 14px", borderTop: "1px solid #edf0ea", borderBottom: "1px solid #edf0ea" }}><div><h2><LayoutDashboard size={15} /> Footer columns</h2><p>Group your footer links into columns.</p></div><button className="button button-small button-outline" onClick={() => setFooter([...footer, { title: "", links: [{ label: "", href: "" }] }])}><Plus size={14} /> Add column</button></div>
    {footer.map((column, ci) => <div key={`col-${ci}`} style={{ border: "1px solid #e7ebe5", borderRadius: 6, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input className="input" value={column.title} placeholder="Column title (e.g. Explore)" onChange={(e) => setFooter((cur) => cur.map((c, i) => (i === ci ? { ...c, title: e.target.value } : c)))} aria-label="Footer column title" />
        <button className="admin-icon-btn danger" title="Remove column" onClick={() => setFooter((cur) => cur.filter((_, i) => i !== ci))}><Trash2 size={14} /></button>
      </div>
      {column.links.map((link, li) => <div className="form-grid" key={`f-${ci}-${li}`} style={{ gridTemplateColumns: "1fr 1.4fr auto", alignItems: "center", marginBottom: 7 }}>
        <input className="input" value={link.label} placeholder="Label" onChange={(e) => setLink(ci, li, { label: e.target.value })} aria-label="Footer link label" />
        <input className="input" value={link.href} placeholder="/path" onChange={(e) => setLink(ci, li, { href: e.target.value })} aria-label="Footer link path" />
        <button className="admin-icon-btn danger" onClick={() => setFooter((cur) => cur.map((c, i) => (i === ci ? { ...c, links: c.links.filter((_, k) => k !== li) } : c)))} aria-label="Remove footer link"><Trash2 size={13} /></button>
      </div>)}
      <button className="button button-small button-outline" onClick={() => setFooter((cur) => cur.map((c, i) => (i === ci ? { ...c, links: [...c.links, { label: "", href: "" }] } : c)))}><Plus size={13} /> Add link</button>
    </div>)}

    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}
    <div className="admin-form-actions"><button className="button button-small" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save menu to draft"}</button></div>
  </div>;
}

const SECTION_META: Record<string, { label: string; hint: string }> = {
  categories: { label: "Shop by category", hint: "Category tiles" },
  journal: { label: "Featured journals", hint: "Best-selling journal grid" },
  ebooks: { label: "E-books shelf", hint: "Dark reading-room band" },
  free: { label: "Free library", hint: "Free items + samples" },
  story: { label: "Our story", hint: "About section with photo" },
  how: { label: "How it works", hint: "Three simple steps" },
  quote: { label: "Testimonial", hint: "Customer quote banner" },
  faq: { label: "FAQ preview", hint: "Most-asked questions" },
};

/**
 * Homepage sections builder: show/hide and reorder homepage bands.
 * Layout is fixed by the design; content is fully admin-controlled.
 */
export function SectionsBuilder({ settings, onSave }: { settings: Record<string, unknown>; onSave: (payload: Payload) => Promise<void> }) {
  const defaults = ["categories", "journal", "ebooks", "free", "story", "how", "quote", "faq"];
  const [order, setOrder] = useState<string[]>(() => Array.isArray(settings.homepageSections) && (settings.homepageSections as string[]).length ? [...settings.homepageSections as string[]] : defaults);
  const [hidden, setHidden] = useState<string[]>(() => {
    const shown = Array.isArray(settings.homepageSections) && (settings.homepageSections as string[]).length ? settings.homepageSections as string[] : [];
    return settings.homepageSections ? defaults.filter((id) => !shown.includes(id)) : [];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  const move = (index: number, dir: -1 | 1) => setOrder((cur) => { const copy = [...cur]; const target = index + dir; if (target < 0 || target >= copy.length) return cur; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; });
  const toggle = (id: string) => setHidden((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function save() {
    setSaving(true); setError(""); setSuccess("");
    try { await onSave({ homepageSections: order.filter((id) => !hidden.includes(id)) }); setSuccess("Homepage layout saved to draft. Preview the homepage, then publish."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
    setSaving(false);
  }

  return <div className="admin-form">
    <p className="admin-help">Toggle sections on/off and drag them into order with the arrows. The homepage rebuilds instantly on publish — no code, no deployment.</p>
    {order.map((id, index) => {
      const meta = SECTION_META[id] || { label: id, hint: "" };
      const isHidden = hidden.includes(id);
      return <div key={id} className={`section-row ${isHidden ? "is-hidden" : ""}`}>
        <span className="section-row-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="section-row-body"><strong>{meta.label}</strong><small>{meta.hint}</small></span>
        <span className="admin-actions">
          <button className="admin-icon-btn" title="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={13} /></button>
          <button className="admin-icon-btn" title="Move down" disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDown size={13} /></button>
          <button className={`admin-icon-btn ${isHidden ? "danger" : ""}`} title={isHidden ? "Show section" : "Hide section"} onClick={() => toggle(id)}>{isHidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
        </span>
      </div>;
    })}
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}
    <div className="admin-form-actions"><button className="button button-small" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save layout to draft"}</button></div>
  </div>;
}
