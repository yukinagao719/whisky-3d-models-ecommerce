import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Loading error:', error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
