import { Component } from "react";

export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Canvas Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "black",
            color: "white",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <h1 style={{ marginBottom: "20px" }}>WebGL Context Error</h1>
          <p style={{ fontSize: "16px", lineHeight: "1.6", maxWidth: "500px" }}>
            WebGL is not available in your environment. This could be due to:
          </p>
          <ul
            style={{
              textAlign: "left",
              fontSize: "14px",
              lineHeight: "1.8",
              marginTop: "20px",
              maxWidth: "500px",
            }}
          >
            <li>GPU/Graphics drivers not available</li>
            <li>Running in a sandboxed or VM environment</li>
            <li>WebGL disabled in browser settings</li>
            <li>Browser incompatibility</li>
          </ul>
          <p style={{ marginTop: "30px", fontSize: "12px", opacity: 0.7 }}>
            Try using a different browser or enabling GPU acceleration in your system settings.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
