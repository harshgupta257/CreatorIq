import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

export function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-black retro-grid-bg px-5 md:px-8 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#9aa4d6] hover:text-[#00ffff] transition-all duration-300 cursor-pointer mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to base
        </Link>
        <h1 className="font-display uppercase text-4xl md:text-5xl neon-cyan mb-3">{title}</h1>
        <p className="text-[11px] uppercase tracking-widest text-[#6a6aa8] mb-12">Last updated · {updated}</p>
        <div className="neon-card p-7 md:p-10 flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm uppercase tracking-[0.2em] neon-pink mb-3">{s.heading}</h2>
              <p className="text-sm text-[#9aa4d6] leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
