import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#090e17] text-white text-center min-h-[300px]">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-xl">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white mb-1.5">
            {this.props.fallbackTitle || 'Something went wrong loading this view'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Click reload to refresh.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
