import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiSlash } from '@phosphor-icons/react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -80, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[9998] flex items-center justify-center gap-3 py-3 bg-orange-500/90 backdrop-blur-xl"
        >
          <WifiSlash size={16} weight="fill" className="text-white" />
          <p className="font-black text-xs uppercase tracking-widest text-white">
            OFFLINE MODE — ZERO-NETWORK ENGINE ACTIVE
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineIndicator;
