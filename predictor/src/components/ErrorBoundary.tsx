import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.errorMsg && this.state.errorMsg.includes('Script error')) {
        return this.props.children;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
           <h1 className="text-3xl font-bold mb-4 text-red-500">Something went wrong</h1>
           <p className="text-gray-400 mb-6">{this.state.errorMsg}</p>
           <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#d4af37] text-black font-semibold rounded-lg hover:bg-[#b0902c]">
             Reload Page
           </button>
        </div>
      );
    }

    return this.props.children;
  }
}
