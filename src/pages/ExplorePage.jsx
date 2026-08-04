import { useState } from "react";
import { Camera, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ExplorePage() {
  const [memories, setMemories] = useState(() => JSON.parse(localStorage.getItem('travelo_memories') || '[]'));

  return (
    <div className="min-h-screen bg-[#030303] pt-40 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20"><p className="text-[11px] font-black tracking-[0.5em] uppercase text-yellow-400/60 mb-6 italic">Memory Vault</p><h1 className="header-massive text-white">THE <span className="text-yellow-400 italic">VAULT.</span></h1></header>
        <div className="silicon-glass border-dashed border-white/10 py-40 flex flex-col items-center justify-center gap-10"><Camera size={100} className="text-white/10" /><p className="font-bebas text-5xl text-white/20 uppercase">DRAG & DROP BANGER PHOTOS</p></div>
      </div>
    </div>
  );
}