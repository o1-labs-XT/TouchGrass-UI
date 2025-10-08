'use client';
import ResultSection from './ResultSection';
import type { Submission } from '../lib/backendClient';

interface TransactionDisplayProps {
  submission: Submission;
  compact?: boolean;
}

export default function TransactionDisplay({
  submission,
  compact = false
}: TransactionDisplayProps) {
  
  const getStatusTitle = (status: Submission['status']) => {
    switch (status) {
      case 'complete':
        return 'Authentication Complete!';
      case 'processing':
        return 'Processing Authentication...';
      case 'awaiting_review':
        return 'Awaiting Review';
      case 'rejected':
        return 'Authentication Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusNote = (status: Submission['status'], transactionId?: string) => {
    switch (status) {
      case 'complete':
        return transactionId
          ? 'Your image authenticity proof is now recorded on the Mina blockchain.'
          : 'Authentication completed successfully.';
      case 'processing':
        return 'Your submission is being processed and will be recorded on the blockchain shortly.';
      case 'awaiting_review':
        return 'Your submission is awaiting manual review before blockchain verification.';
      case 'rejected':
        return submission.failureReason || 'Your submission was rejected during verification.';
      default:
        return 'Status unknown.';
    }
  };

  return (
    <ResultSection
      status={submission.status}
      title={getStatusTitle(submission.status)}
      walletAddress={submission.walletAddress}
      imageHash={submission.sha256Hash}
      transactionId={submission.transactionId}
      note={getStatusNote(submission.status, submission.transactionId)}
      compact={compact}
    />
  );
}