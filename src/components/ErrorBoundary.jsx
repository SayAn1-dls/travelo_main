import React from "react";
import { AirplaneTilt } from "@phosphor-icons/react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[Travelo v4.0] Error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-12 border border-red-500/20">
            <AirplaneTilt size={40} weight="fill" className="text-red-500" />
          </div>
          <h1 className="text-[8rem] font-[900] font-bebas leading-none text-white mb-0">CRASH.</h1>
          <p className="font-marker text-orange-500 text-2xl italic uppercase mb-6">Mission Interrupted.</p>
          <p className="text-white/30 font-bold uppercase tracking-widest text-sm mb-16 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/dashboard"; }}
            className="btn-launch"
          >
            RETRY MISSION
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
