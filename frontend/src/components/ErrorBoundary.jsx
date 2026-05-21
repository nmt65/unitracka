import { Component } from "react";

const showErrorDetails = import.meta.env.DEV;

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UniTrack render error", error, info);
    this.setState({ errorMessage: error?.message || String(error) });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="loading-screen error-screen">
        <section className="profile-panel">
          <h1>Aplicația trebuie reîncărcată</h1>
          <p className="muted">Am prins o eroare de interfață înainte să blocheze pagina.</p>
          {showErrorDetails && this.state.errorMessage && <pre className="error-details">{this.state.errorMessage}</pre>}
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reîncarcă UniTrack</button>
        </section>
      </main>
    );
  }
}
