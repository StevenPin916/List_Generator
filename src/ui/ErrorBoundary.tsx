import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Si algo falla en la interfaz, en vez de una pantalla en blanco se ofrece volver a empezar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="modal" role="alert" style={{ maxWidth: 520 }}>
          <h2>Algo salió mal</h2>
          <p className="sub">
            La pantalla se reinicia y hay que volver a cargar los archivos del día. Tus alias y la carpeta de listas siguen
            guardados en este PC.
          </p>
          <p className="sub mono" style={{ fontSize: 13 }}>{this.state.error.message}</p>
          <div className="actions">
            <button className="btn primary" type="button" onClick={() => window.location.reload()}>Volver a empezar</button>
          </div>
        </div>
      </div>
    );
  }
}
