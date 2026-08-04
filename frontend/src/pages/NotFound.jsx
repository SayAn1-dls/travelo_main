import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-5 pt-16 text-center text-white">
      <h1 className="font-display text-[clamp(6rem,25vw,20rem)] leading-none text-outline-blaze">404</h1>
      <p className="font-marker text-2xl text-acid">you've wandered off the map.</p>
      <Link
        to="/"
        className="mt-10 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
      >
        Back to civilization
      </Link>
    </div>
  );
}
