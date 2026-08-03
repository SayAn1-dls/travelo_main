import { Link } from "react-router-dom";
import { AirplaneTilt, ArrowLeft } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_50%_50%,rgba(255,77,0,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-12"><AirplaneTilt size={120} className="text-orange-500/30" weight="fill" /></div>
        <h1 className="text-[20vw] font-[900] leading-none uppercase font-bebas text-white/10">404</h1>
        <h2 className="text-[8vw] font-[900] leading-none uppercase font-bebas text-white -mt-8 mb-8">MISSION<br/><span className="text-orange-500 italic">NOT FOUND.</span></h2>
        <p className="text-white/30 font-bold text-2xl italic uppercase tracking-widest mb-20 max-w-lg">"THIS ROUTE DOESN'T EXIST. BUT YOURS DOES."</p>
        <Link to="/dashboard"><button className="btn-launch py-8 px-20 text-3xl"><ArrowLeft weight="bold" size={32} /> RETURN TO HQ</button></Link>
      </div>
    </div>
  );
}
