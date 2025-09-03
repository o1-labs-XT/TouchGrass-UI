/**
 * Translates technical errors into user-friendly messages
 */

import { UserError, ErrorCategory, ErrorContext } from './types';

/**
 * Translates any error into a user-friendly format
 */
export function translateError(
  error: any,
  context?: ErrorContext
): UserError {
  const errorStr = error?.message || error?.toString() || 'Unknown error';
  const category = categorizeError(errorStr);
  
  // Log technical details for debugging
  console.error('[Error Translator]', {
    category,
    original: errorStr,
    context,
    stack: error?.stack
  });
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return translateNetworkError(errorStr);
    
    case ErrorCategory.VALIDATION:
      return translateValidationError(errorStr);
    
    case ErrorCategory.BLOCKCHAIN:
      return translateBlockchainError(errorStr);
    
    case ErrorCategory.DUPLICATE:
      return translateDuplicateError(errorStr);
    
    case ErrorCategory.TIMEOUT:
      return translateTimeoutError(errorStr, context);
    
    case ErrorCategory.PROCESSING:
      return translateProcessingError(errorStr);
    
    default:
      return createGenericError(errorStr);
  }
}

/**
 * Categorizes error based on message content
 */
function categorizeError(errorMessage: string): ErrorCategory {
  const message = errorMessage.toLowerCase();
  
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('err_network') ||
    message.includes('connection')
  ) {
    return ErrorCategory.NETWORK;
  }
  
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('format') ||
    message.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }
  
  if (
    message.includes('blockchain') ||
    message.includes('transaction') ||
    message.includes('mina') ||
    message.includes('zkapp')
  ) {
    return ErrorCategory.BLOCKCHAIN;
  }
  
  if (
    message.includes('already exists') ||
    message.includes('duplicate')
  ) {
    return ErrorCategory.DUPLICATE;
  }
  
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('too long')
  ) {
    return ErrorCategory.TIMEOUT;
  }
  
  if (
    message.includes('processing') ||
    message.includes('computing') ||
    message.includes('generating')
  ) {
    return ErrorCategory.PROCESSING;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Network error translations
 */
function translateNetworkError(errorMessage: string): UserError {
  if (errorMessage.includes('Failed to fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to our servers. Please check your internet connection and try again.',
      actions: ['Check your internet connection', 'Try again in a moment'],
      canRetry: true,
      severity: 'warning',
      technicalDetails: errorMessage
    };
  }
  
  return {
    title: 'Network Error',
    message: 'We encountered a network problem. Please check your connection and try again.',
    actions: ['Check connection', 'Retry'],
    canRetry: true,
    severity: 'warning',
    technicalDetails: errorMessage
  };
}

/**
 * Validation error translations
 */
function translateValidationError(errorMessage: string): UserError {
  if (errorMessage.includes('signature')) {
    return {
      title: 'Signature Invalid',
      message: 'The digital signature could not be verified. Please try signing the image again.',
      actions: ['Retry authentication'],
      canRetry: true,
      severity: 'error',
      technicalDetails: errorMessage
    };
  }
  
  if (errorMessage.includes('image') || errorMessage.includes('file')) {
    return {
      title: 'Invalid Image',
      message: 'The selected file is not a valid image or is corrupted. Please select a different image.',
      actions: ['Choose a different image'],
      canRetry: false,
      severity: 'error',
      technicalDetails: errorMessage
    };
  }
  
  return {
    title: 'Validation Error',
    message: 'The submitted information is invalid. Please check and try again.',
    actions: ['Review your input', 'Try again'],
    canRetry: true,
    severity: 'error',
    technicalDetails: errorMessage
  };
}

/**
 * Blockchain error translations
 */
function translateBlockchainError(errorMessage: string): UserError {
  if (errorMessage.includes('Unknown Error: {}')) {
    return {
      title: 'Blockchain Connection Issue',
      message: 'Unable to submit to the Mina blockchain. The network may be congested.',
      actions: ['Wait a moment', 'Try again'],
      canRetry: true,
      severity: 'warning',
      technicalDetails: errorMessage
    };
  }
  
  return {
    title: 'Blockchain Error',
    message: 'There was a problem interacting with the blockchain. Please try again.',
    actions: ['Retry submission'],
    canRetry: true,
    severity: 'error',
    technicalDetails: errorMessage
  };
}

/**
 * Duplicate error translations
 */
function translateDuplicateError(errorMessage: string): UserError {
  return {
    title: 'Image Already Authenticated',
    message: 'This image has already been registered and verified on the blockchain.',
    actions: ['View existing proof', 'Upload a different image'],
    canRetry: false,
    severity: 'info',
    technicalDetails: errorMessage
  };
}

/**
 * Timeout error translations
 */
function translateTimeoutError(
  errorMessage: string,
  context?: ErrorContext
): UserError {
  const operation = context?.operation;
  
  if (operation === 'prove') {
    return {
      title: 'Taking Longer Than Expected',
      message: 'The authentication process is taking longer than usual. The blockchain network may be congested.',
      actions: ['Wait a bit longer', 'Try again later'],
      canRetry: true,
      severity: 'warning',
      technicalDetails: errorMessage
    };
  }
  
  return {
    title: 'Request Timed Out',
    message: 'The operation took too long to complete. Please try again.',
    actions: ['Retry'],
    canRetry: true,
    severity: 'warning',
    technicalDetails: errorMessage
  };
}

/**
 * Processing error translations
 */
function translateProcessingError(errorMessage: string): UserError {
  if (errorMessage.includes('commitment')) {
    return {
      title: 'Processing Error',
      message: 'Failed to process the image. Please try uploading again.',
      actions: ['Re-upload image'],
      canRetry: true,
      severity: 'error',
      technicalDetails: errorMessage
    };
  }
  
  return {
    title: 'Processing Failed',
    message: 'We encountered an error while processing your request. Please try again.',
    actions: ['Retry'],
    canRetry: true,
    severity: 'error',
    technicalDetails: errorMessage
  };
}

/**
 * Generic error fallback
 */
function createGenericError(errorMessage: string): UserError {
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    actions: ['Try again', 'Refresh page'],
    canRetry: true,
    severity: 'error',
    technicalDetails: errorMessage
  };
}