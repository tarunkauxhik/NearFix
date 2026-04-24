import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  default: 'border-white/10 bg-white/[0.05] text-white/75',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  danger: 'border-red-400/20 bg-red-400/10 text-red-100',
  info: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
};

export function AdminPageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function AdminSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-white/55">{description}</p> : null}
        </div>
        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminSummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  const iconToneClass =
    tone === 'success'
      ? 'bg-emerald-400/15 text-emerald-100'
      : tone === 'warning'
        ? 'bg-amber-400/15 text-amber-100'
        : tone === 'danger'
          ? 'bg-red-400/15 text-red-100'
          : tone === 'info'
            ? 'bg-sky-400/15 text-sky-100'
            : 'bg-[#FF6B00]/15 text-[#FF6B00]';

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          {hint ? <p className="mt-2 text-xs leading-5 text-white/50">{hint}</p> : null}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconToneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminStatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

export function AdminSubnav({
  links,
}: {
  links: Array<{ label: string; href: string; active?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            link.active
              ? 'border-[#FF6B00]/30 bg-[#FF6B00]/12 text-[#FF6B00]'
              : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function AdminQuickAction({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#FF6B00]/30 hover:bg-black/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
      </div>
    </Link>
  );
}
