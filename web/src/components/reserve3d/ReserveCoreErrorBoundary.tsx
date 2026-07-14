import { Component, type ErrorInfo, type ReactNode } from 'react';

type ReserveCoreErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  resetKey?: string;
  retryFallback?: ReactNode;
};

type ReserveCoreErrorBoundaryState = {
  hasError: boolean;
  retryCount: number;
};

export class ReserveCoreErrorBoundary extends Component<
  ReserveCoreErrorBoundaryProps,
  ReserveCoreErrorBoundaryState
> {
  state: ReserveCoreErrorBoundaryState = { hasError: false, retryCount: 0 };
  private retryTimer: number | null = null;

  static getDerivedStateFromError(): Partial<ReserveCoreErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Reserve Core 3D could not be rendered.', error, info);

    if (this.state.retryCount === 0) {
      this.retryTimer = window.setTimeout(() => {
        this.retryTimer = null;
        this.setState({ hasError: false, retryCount: 1 });
      }, 500);
    }
  }

  componentDidUpdate(previousProps: ReserveCoreErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey) {
      this.clearRetryTimer();
      this.setState({ hasError: false, retryCount: 0 });
    }
  }

  componentWillUnmount() {
    this.clearRetryTimer();
  }

  private clearRetryTimer() {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return this.state.retryCount === 0
      ? (this.props.retryFallback ?? this.props.fallback)
      : this.props.fallback;
  }
}
