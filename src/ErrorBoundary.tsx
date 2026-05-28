import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ChessLens] Uncaught error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              gap: "1rem",
              color: "#e8e8e8",
              background: "#0a0a0a",
              fontFamily: "system-ui, sans-serif",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>
              Please refresh the page. If the problem persists, try clearing
              your browser cache.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1.5rem",
                background: "none",
                border: "1px solid #555",
                color: "#e8e8e8",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}