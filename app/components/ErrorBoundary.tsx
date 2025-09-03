'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.message}>An unexpected error occurred.</p>
            
            <div className={styles.actions}>
              <button 
                onClick={() => window.location.reload()}
                className={styles.primaryButton}
              >
                Reload Page
              </button>
            </div>
            
            <p className={styles.helpText}>
              If this problem persists, please try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;