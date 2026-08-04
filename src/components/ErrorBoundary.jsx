import { Component } from 'react';
import { AirplaneTilt } from '@phosphor-icons/react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[TRAVELO ERROR BOUNDARY]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center px-8">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 text-red-400">
          <AirplaneTilt size={40} weight="fill" className="rotate-180" />
        </div>
        <h1 className="text-6xl font-[900] font-bebas text-white italic mb-4 uppercase">MISSION ABORTED</h1>
        <p className="text-white/30 font-black text-sm uppercase tracking-widest mb-12">
          {this.state.error?.message ?? 'An unexpected fault occurred in the intelligence engine.'}
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="btn-launch px-12 py-5 rounded-2xl text-sm"
        >
          RETRY MISSION
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
