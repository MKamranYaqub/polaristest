import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem' }}>
          <h2>Something went wrong</h2>
          <div style={{ whiteSpace: 'pre-wrap', color: '#a94442' }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.info && this.state.info.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
