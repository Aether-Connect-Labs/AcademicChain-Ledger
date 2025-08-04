import React from 'react';
import * as Sentry from "@sentry/react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);  }

  static getDerivedStateFromError(error) {
    Sentry.captureException(error);
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Caught an error in ErrorBoundary: ", error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  resetErrorBoundary() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>{this.props.errorMessage || "Something went wrong."}</h1>
          {this.props.onReset ? (
            <button onClick={this.resetErrorBoundary}>Try again</button>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary