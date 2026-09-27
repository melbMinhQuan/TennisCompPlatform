import type { ReactNode } from "react";

type ContactCardProps = {
  title: string;
  description: string;
  /** Real contact details; when missing, the general advice in `fallback` is shown. */
  children?: ReactNode;
  fallback: string;
};

export default function ContactCard({ title, description, children, fallback }: ContactCardProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-[#1a3049] [overflow-wrap:anywhere]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{children ?? fallback}</div>
    </section>
  );
}
