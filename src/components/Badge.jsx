/**
 * Badge — mission status indicator atom.
 * Variants: active | pending | complete | danger | elite
 */
const VARIANTS = {
  active:   'bg-green-500/10 border-green-500/30 text-green-400',
  pending:  'bg-orange-500/10 border-orange-500/30 text-orange-400',
  complete: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  danger:   'bg-red-500/10 border-red-500/30 text-red-400',
  elite:    'bg-white/5 border-white/20 text-white',
};

export function Badge({ variant = 'elite', children, dot = false }) {
  const cls = VARIANTS[variant] ?? VARIANTS.elite;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'active' ? 'bg-green-400 animate-ping' : 'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
