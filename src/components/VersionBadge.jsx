import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function VersionBadge() {
  const { firebaseEnabled } = useAuth();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="fixed bottom-6 right-6 z-50 no-print pointer-events-none"
    >
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 backdrop-blur-xl">
        <div className="w-2 h-2 rounded-full animate-pulse bg-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">v4.0 MASTERPIECE</span>
      </div>
    </motion.div>
  );
}
