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
          <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            页面出错了
          </h2>
          <p className="mb-2 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
            渲染页面时发生了意外错误。错误已自动上报，我们会尽快修复。
          </p>
          {this.state.error && (
            <p className="mb-6 max-w-md truncate text-center text-xs font-mono text-slate-400 dark:text-slate-500">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              刷新页面
            </button>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
