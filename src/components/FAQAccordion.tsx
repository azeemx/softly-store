"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function FAQAccordion({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id || null);
  return <div className="faq-list">{items.map((item) => <div className="faq-item" key={item.id}><button className="faq-question" aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)}><span>{item.question}</span>{open === item.id ? <Minus size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}</button>{open === item.id && <div className="faq-answer">{item.answer}</div>}</div>)}</div>;
}
