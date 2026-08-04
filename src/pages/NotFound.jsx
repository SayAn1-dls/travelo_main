import { Link } from "react-router-dom";
import { Warning } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center px-6">
       <Warning size={120} className="text-orange-500 mb-12 animate-pulse" />
       <h1 className="header-massive text-white mb-8">LOST IN <br/><span className="text-orange-500 italic">SECTOR 404.</span></h1>
       <p className="text-white/30 font-bold uppercase tracking-widest text-xl mb-16 italic">\"THE DESTINATION YOU SEEK DOES NOT EXIST IN THIS MULTIVERSE.\"</p>
       <Link to="/dashboard"><button className="btn-launch text-3xl px-16 py-8 rounded-[2.5rem]">RETURN TO COMMAND HQ</button></Link>
    </div>
  );
}