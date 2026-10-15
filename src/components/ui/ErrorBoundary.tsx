import { Component, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  onError?: (error: unknown) => void;
  children: ReactNode;
}

/** Swallows render errors from optional enhancements (e.g. WebGL failures). */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn('[3D disabled]', error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
