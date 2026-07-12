import { Component, type ErrorInfo, type ReactNode } from 'react';

type ReserveCoreErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ReserveCoreErrorBoundaryState = {
  hasError: boolean;
};

export class ReserveCoreErrorBoundary extends Component<
  ReserveCoreErrorBoundaryProps,
  ReserveCoreErrorBoundaryState
> {
  state: ReserveCoreErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ReserveCoreErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Reserve Core 3D could not be rendered.', error, info);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
