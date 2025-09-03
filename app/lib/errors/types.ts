/**
 * Error types and interfaces for the application
 */

export interface UserError {
  /** Short, clear title for the error */
  title: string;
  
  /** Detailed explanation in user-friendly language */
  message: string;
  
  /** Suggested actions the user can take */
  actions?: string[];
  
  /** Whether the operation can be retried */
  canRetry: boolean;
  
  /** Error severity level */
  severity: 'info' | 'warning' | 'error';
  
  /** Original technical error for logging */
  technicalDetails?: string;
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BLOCKCHAIN = 'BLOCKCHAIN',
  PROCESSING = 'PROCESSING',
  DUPLICATE = 'DUPLICATE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  /** What operation was being performed */
  operation?: 'upload' | 'prove' | 'verify' | 'status';
  
  /** Current step in the process */
  step?: string;
  
  /** Additional context data */
  metadata?: Record<string, any>;
}