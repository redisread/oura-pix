/**
 * ErrorBoundary Component
 *
 * Catches React rendering errors in child components and displays a fallback UI.
 * Automatically reports errors to the backend via errorReporter.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import * as m from "@/paraglide/messages.js";
import { reportError } from "@/lib/errorReporter";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to backend
    reportError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      boundary: "ErrorBoundary",
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-16">
          <div className="mb-6 rounded-md bg-[hsl(var(--color-error-light))] p-4 text-[hsl(var(--color-error))]">
            <AlertTriangle className="h-10 w-10" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
            {m.errorBoundary_title()}
          </h2>
          <p className="mb-2 max-w-md text-center text-sm text-foreground-muted">
            {m.errorBoundary_description()}
          </p>
          {this.state.error && (
            <p className="font-utility mb-6 max-w-md truncate text-center text-xs text-foreground-muted">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="btn-primary h-10 gap-2 px-4"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {m.errorBoundary_reload()}
            </button>
            <button
              onClick={this.handleReset}
              className="btn-secondary h-10 px-4"
            >
              {m.common_retry()}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
