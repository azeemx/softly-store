import { BookOpen, CreditCard, UserRound, Check } from "lucide-react";

export default function CheckoutSteps({ current, freeOnly = false }: { current: 1 | 2 | 3; freeOnly?: boolean }) {
  const steps = [{ label: "Your details", icon: UserRound }, { label: freeOnly ? "Review" : "Payment & Review", icon: CreditCard }, { label: "Start Reading", icon: BookOpen }];
  return <ol className="checkout-steps" aria-label="Checkout progress">{steps.map((step, index) => { const number = (index + 1) as 1 | 2 | 3; const Icon = step.icon; const state = number < current ? "done" : number === current ? "active" : ""; return <li key={step.label} className={`checkout-step ${state}`} aria-current={number === current ? "step" : undefined}><span className="checkout-step-icon">{number < current ? <Check size={14} /> : <Icon size={15} />}</span><span>{step.label}</span></li>; })}</ol>;
}
