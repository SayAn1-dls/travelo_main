import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-10 text-white p-10">
          <p className="text-9xl">💀</p>
          <h1 className="text-[12vw] font-[900] font-bebas uppercase italic text-orange-500 leading-none">CRASHED.</h1>
          <p className="text-white/30 font-bold text-2xl uppercase tracking-widest italic text-center max-w-lg">
            "Even the best trips hit turbulence. Reload and try again."
          </p>
          <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="bg-orange-500 text-white font-black uppercase px-10 py-6 rounded-2xl tracking-widest hover:bg-orange-400 transition-all">
              RELOAD
            </button>
            <Link to="/dashboard" onClick={() => this.setState({ hasError: false })} className="no-underline bg-white/5 border border-white/10 text-white/40 font-black uppercase px-10 py-6 rounded-2xl tracking-widest hover:bg-white/10 transition-all">
              BACK TO HQ
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
