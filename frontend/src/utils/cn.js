// cn() — conditional className utility
// Merges Tailwind classes safely without clsx/tailwind-merge dep overhead
export function cn(...classes) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ');
}

export default cn;
