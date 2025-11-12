'use client';
import styles from './ResultSection.module.css';
import CopyButton from './CopyButton';
import Button from './Button';

interface ResultSectionProps {
  status: 'complete' | 'processing' | 'awaiting_review' | 'rejected';
  title: string;
  walletAddress?: string;
  imageHash: string;
  transactionId?: string;
  note: string;
  compact?: boolean;
}

export default function ResultSection({
  status,
  title,
  walletAddress,
  imageHash,
  transactionId,
  note,
  compact = false
}: ResultSectionProps) {

  const truncateValue = (value: string, length: number = 48) => {
    return `${value.substring(0, length)}...`;
  };

  const getMinaScanUrl = (address: string) => {
    const network = process.env.VERCEL_ENV === "production" ? "mainnet" : "devnet";
    return `https://minascan.io/${network}/account/${address}`;
  };

  const getTransactionUrl = (txHash: string) => {
    const network = process.env.VERCEL_ENV === "production" ? "mainnet" : "devnet";
    return `https://minascan.io/${network}/tx/${txHash}`;
  };

  const isSuccessState = status === 'complete';
  const isPendingState = status === 'processing' || status === 'awaiting_review';

  return (
    <div className={`${styles.resultSection} ${styles[status]} ${compact ? styles.compact : ''}`}>
      <div className={styles.resultHeader}>
        <h3 className={styles.resultTitle}>
          {title}
        </h3>
      </div>

      <div className={styles.resultDetails}>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>Image Hash:</span>
          <div className={styles.resultValueBox}>
            <code className={styles.resultValueText}>
              {truncateValue(imageHash)}
            </code>
            <CopyButton text={imageHash} title="Copy full hash" />
          </div>
        </div>

        {walletAddress && (
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Wallet Address:</span>
            <div className={styles.resultValueBox}>
              <code className={styles.resultValueText}>
                {truncateValue(walletAddress)}
              </code>
              <CopyButton text={walletAddress} title="Copy full address" />
            </div>
          </div>
        )}

        {transactionId && (
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Transaction ID:</span>
            <div className={styles.resultValueBox}>
              <code className={styles.resultValueText}>
                {truncateValue(transactionId)}
              </code>
              <CopyButton text={transactionId} title="Copy transaction ID" />
            </div>
          </div>
        )}
      </div>

      {(transactionId || (isSuccessState && walletAddress)) && (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            href={transactionId 
              ? getTransactionUrl(transactionId)
              : getMinaScanUrl(walletAddress!)}
          >
            View on MinaScan →
          </Button>
        </div>
      )}

      <p className={styles.resultNote}>
        {isPendingState && (
          <span className={styles.spinner}></span>
        )}
        {note}
      </p>
    </div>
  );
}