import { motion } from "framer-motion";

export default function VersionBadge() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-10 right-10 z-[500] pointer-events-none hidden md:block"
    >
      <div className="silicon-glass border-white/5 p-4 rounded-2xl flex flex-col items-end">
        <p className="text-[8px] font-black text-white/20 tracking-[0.5em] uppercase mb-1">SYSTEM VERSION</p>
        <p className="text-xl font-[900] font-bebas text-orange-500 tracking-widest italic">V4.0.2 MASTERPIECE</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">ENCRYPTED CORE</span>
        </div>
      </div>
    </motion.div>
  );
}