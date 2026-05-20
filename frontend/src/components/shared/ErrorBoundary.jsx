import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: 32,
          textAlign: 'center', fontFamily: 'Nunito, sans-serif',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#1E3A5F', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
            O app encontrou um problema inesperado.
          </p>
          <button
            style={{
              background: '#1E3A5F', color: 'white', border: 'none',
              borderRadius: 14, padding: '14px 32px', fontSize: 15,
              fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Recarregar app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
