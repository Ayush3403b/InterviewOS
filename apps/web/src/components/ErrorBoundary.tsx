import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled rendering error]:", {
      error,
      errorInfo,
      errorId: this.state.errorId,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: "" });
    window.location.href = "/app";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B0F19",
            color: "#F3F4F6",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "36px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "14px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#FFFFFF",
                margin: "0 0 10px 0",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "#9CA3AF",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
              }}
            >
              An unexpected client error occurred. Your interview session state and drafts are securely cached.
            </p>

            {this.state.errorId && (
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(31, 41, 55, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.4)",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#9CA3AF",
                  marginBottom: "24px",
                }}
              >
                Trace ID: {this.state.errorId}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  backgroundColor: "#3B82F6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(55, 65, 81, 0.8)",
                  color: "#D1D5DB",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
