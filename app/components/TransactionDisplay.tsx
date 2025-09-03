'use client';
import ResultSection from './ResultSection';

interface TransactionDisplayProps {
  tokenOwner: string;
  imageHash: string;
  transactionHash?: string;
  status?: 'success' | 'pending' | 'error';
  title?: string;
  note?: string;
}

export default function TransactionDisplay({
  tokenOwner,
  imageHash,
  transactionHash,
  status = 'success',
  title = 'Authentication Complete!',
  note = 'Your image authenticity proof is now recorded on the Mina blockchain.'
}: TransactionDisplayProps) {
  return (
    <ResultSection
      status={status}
      title={title}
      tokenOwner={tokenOwner}
      imageHash={imageHash}
      transactionHash={transactionHash}
      note={note}
    />
  );
}