import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppIcon } from './AppIcon';
import { Button } from './M3';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-on-surface">
          <div className="bg-error-container text-on-error-container p-8 rounded-3xl max-w-md w-full shadow-elevation-3 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-error text-on-error rounded-full flex items-center justify-center mb-6">
              <AppIcon name="error" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="opacity-80 mb-8">
              The application encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {this.state.error && (
              <div className="w-full bg-surface-variant/30 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32 text-xs font-mono">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-4">
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
                label="Reload Page"
                icon="refresh"
              />
              <Button 
                variant="filled" 
                onClick={this.handleReset}
                label="Back to Safety"
                icon="home"
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
