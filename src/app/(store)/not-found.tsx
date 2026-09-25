import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() { return <main className="success-page"><span className="eyebrow">A LITTLE DETOUR</span><h1>Looks like this page wandered off.</h1><p>No worries. There are still plenty of lovely places to begin.</p><Link href="/shop" className="button" style={{ marginTop: 20 }}>Explore the journals <ArrowRight size={15} /></Link></main>; }
