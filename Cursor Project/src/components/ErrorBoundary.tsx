import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  errorMessage: string | null;
}

/**
 * Catches render errors so one panel failure does not blank the whole window.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { errorMessage: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      errorMessage:
        error instanceof Error ? error.message : "Unexpected render failure",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("UI error boundary caught", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.errorMessage) {
      return (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-100">
          <p className="font-medium">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </p>
          <p className="mt-1 text-rose-200/80">{this.state.errorMessage}</p>
          <button
            type="button"
            className="focus-ring mt-3 rounded border border-rose-400/40 px-2 py-1 text-xs hover:bg-rose-900/50"
            onClick={() => this.setState({ errorMessage: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
