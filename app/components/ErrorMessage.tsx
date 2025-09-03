/**
 * Reusable error message display component
 */

import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  /** Error title */
  title?: string;
  
  /** Error message to display */
  message: string;
  
  /** Optional retry action */
  onRetry?: () => void;
  
  /** Optional dismiss action */
  onDismiss?: () => void;
  
  /** Error severity */
  severity?: 'info' | 'warning' | 'error';
}

export default function ErrorMessage({
  title,
  message,
  onRetry,
  onDismiss,
  severity = 'error'
}: ErrorMessageProps) {
  return (
    <div className={`${styles.errorContainer} ${styles[severity]}`}>
      <div className={styles.content}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message}</p>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className={styles.actions}>
          {onRetry && (
            <button
              onClick={onRetry}
              className={styles.retryButton}
              aria-label="Retry"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={styles.dismissButton}
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}