import { motion } from 'framer-motion';
import { AirplaneTilt } from '@phosphor-icons/react';

export function Loader({ size = 'md', text = 'INITIALIZING...' }) {
  const sizes = { sm: 24, md: 40, lg: 64 };
  const iconSize = sizes[size] ?? sizes.md;

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-2 border-white/5 border-t-orange-500"
        />
        <div className="absolute inset-0 flex items-center justify-center text-orange-500">
          <AirplaneTilt size={iconSize} weight="fill" />
        </div>
      </div>
      {text && (
        <p className="font-black text-[10px] tracking-[0.4em] uppercase text-white/30 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#030303] flex items-center justify-center z-[9999]">
      <Loader size="lg" text="LOADING MISSION INTEL..." />
    </div>
  );
}

export default Loader;
