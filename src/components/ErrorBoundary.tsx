import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearDraft = () => {
    try {
      localStorage.removeItem('cvforge_resume_active');
    } catch (err) {
      console.warn('Could not remove the local resume draft:', err);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="mt-4 text-lg font-bold">Something went wrong</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your latest draft is saved in this browser. Reload the app to continue, or clear the local draft if the problem keeps happening.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload app
            </button>
            <button
              onClick={this.handleClearDraft}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear local draft
            </button>
          </div>
          {this.state.message && (
            <details className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              <summary className="cursor-pointer font-semibold">Technical details</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-950 p-3 font-mono text-[11px] whitespace-pre-wrap">
                {this.state.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
