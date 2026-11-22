import React from 'react';
import { RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected rendering error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF5EE] text-[#242424] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E5D9C5] rounded-xl p-8 text-center">
            <p className="font-serif text-2xl font-semibold text-[#090909] mb-2">
              MCFD J GLOBAL VENTURES
            </p>
            <p className="text-sm text-neutral-600 mb-6">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#090909] text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#D4AF5A]" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
