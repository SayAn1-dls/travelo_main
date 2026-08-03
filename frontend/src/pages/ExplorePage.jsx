import { useEffect, useRef, useState } from "react";
import { Image, Plus, Trash, Camera, Download } from "@phosphor-icons/react";
import { toast } from "sonner";

// 6 curated dream destinations — expandable
const DESTINATIONS = [
  { name: "GOA", country: "INDIA", emoji: "🏝️", vibe: "Shacks, sunsets, and zero regrets." },
  { name: "BALI", country: "INDONESIA", emoji: "🌴", vibe: "Temples, rice fields, and pure magic." },
  { name: "SANTORINI", country: "GREECE", emoji: "🌊", vibe: "Blue domes and feta dreams." },
  { name: "KYOTO", country: "JAPAN", emoji: "⛩️", vibe: "Cherry blossoms and ancient calm." },
  { name: "DUBAI", country: "UAE", emoji: "🌆", vibe: "Skyscrapers and gold everything." },
  { name: "MANALI", country: "INDIA", emoji: "🏔️", vibe: "Snow, chai, and endless chill." },
];

export default function ExplorePage() {
  const [memories, setMemories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('travelo_memories') || '[]'); }
    catch { return []; }
  });
  const [caption, setCaption] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    localStorage.setItem('travelo_memories', JSON.stringify(memories));
  }, [memories]);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error("IMAGES ONLY, OPERATIVE.");
    if (file.size > 5 * 1024 * 1024) return toast.error("MAX 5MB PER PHOTO. THE VIBE IS BIG, THE FILE IS NOT.");
    const reader = new FileReader();
    reader.onload = (e) => {
      const mem = {
        id: Date.now().toString(),
        src: e.target.result,
        caption: caption.toUpperCase() || 'NO CAPTION — STILL A BANGER.',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: file.name,
      };
      setMemories(prev => [mem, ...prev]);
      setCaption('');
      toast.success("📸 MEMORY STORED. THIS ONE'S FOR THE VAULT.");
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files) => Array.from(files).forEach(processFile);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const deleteMemory = (id) => {
    setMemories(memories.filter(m => m.id !== id));
    toast.error("MEMORY DELETED.");
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_50%_0%,rgba(250,204,21,0.03)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">

        <header className="mb-20">
          <p className="text-[11px] font-black tracking-[0.5em] uppercase text-yellow-400/60 mb-6 italic">Memory Vault</p>
          <h1 className="text-[12vw] md:text-[8vw] font-[900] leading-[0.78] uppercase font-bebas text-white">
            THE <span className="text-yellow-400 italic">VAULT.</span>
          </h1>
          <p className="text-white/30 font-bold text-2xl mt-8 italic uppercase tracking-widest">
            \"IF IT AIN'T IN THE VAULT, DID IT EVEN HAPPEN? SCIENCE SAYS NO.\"
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-2">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative min-h-[320px] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                dragging
                  ? 'border-yellow-400 bg-yellow-400/5'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
              <Camera size={80} className={`mb-8 transition-colors ${dragging ? 'text-yellow-400' : 'text-white/10'}`} weight="duotone" />
              <p className={`font-[900] text-4xl font-bebas uppercase italic transition-colors ${dragging ? 'text-yellow-400' : 'text-white/30'}`}>
                {dragging ? 'DROP IT HERE' : 'DRAG & DROP PHOTOS'}
              </p>
              <p className="text-white/20 font-bold text-sm uppercase tracking-widest mt-4">or click to browse · Max 5MB per photo</p>
              <div className="absolute bottom-8 right-8">
                <Plus size={40} className="text-white/10" />
              </div>
            </div>
          </div>

          <div className="silicon-glass border-yellow-400/10 flex flex-col">
            <h3 className="text-4xl font-[900] font-bebas text-white uppercase italic mb-8">ADD CAPTION</h3>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="GOA SUNSET, DAY 1..."
              className="silicon-input mb-6"
            />
            <p className="text-white/20 font-bold text-xs uppercase tracking-widest mt-auto mb-6">
              📸 {memories.length} memories stored
            </p>
            <div className="space-y-3">
              {[
                { stat: memories.length, label: 'Photos' },
                { stat: new Set(memories.map(m => m.date)).size, label: 'Days captured' },
              ].map(s => (
                <div key={s.label} className="flex justify-between font-black text-sm uppercase">
                  <span className="text-white/30 tracking-widest">{s.label}</span>
                  <span className="text-yellow-400">{s.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {memories.length > 0 && (
          <>
            <h2 className="text-6xl font-[900] font-bebas text-white uppercase italic mb-12">
              YOUR MEMORIES ({memories.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
              {memories.map(mem => (
                <div key={mem.id} className="group relative rounded-[1.5rem] overflow-hidden aspect-square">
                  <img src={mem.src} alt={mem.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="font-[900] text-xl font-bebas text-white uppercase italic leading-tight">{mem.caption}</p>
                    <p className="font-black text-xs text-white/50 uppercase tracking-widest mt-1">{mem.date}</p>
                  </div>
                  <button
                    onClick={() => deleteMemory(mem.id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-white"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div>
          <h2 className="text-6xl font-[900] font-bebas text-white uppercase italic mb-12">
            DREAM <span className="text-yellow-400">DESTINATIONS</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
            {DESTINATIONS.map(d => (
              <div key={d.name} className="silicon-glass group hover:border-yellow-400/20 transition-all cursor-pointer p-8 flex flex-col gap-4">
                <div className="text-6xl">{d.emoji}</div>
                <div>
                  <p className="font-[900] text-2xl font-bebas text-white uppercase italic">{d.name}</p>
                  <p className="font-black text-xs text-white/30 uppercase tracking-widest">{d.country}</p>
                </div>
                <p className="text-white/20 font-medium text-xs leading-relaxed">{d.vibe}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );