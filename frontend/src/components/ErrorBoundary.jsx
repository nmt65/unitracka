import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UniTrack render error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="loading-screen error-screen">
        <section className="profile-panel">
          <h1>Aplicația trebuie reîncărcată</h1>
          <p className="muted">Am prins o eroare de interfață înainte să blocheze pagina.</p>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reîncarcă UniTrack</button>
        </section>
      </main>
    );
  }
}
