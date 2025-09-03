'use client';
import styles from './ResultSection.module.css';
import CopyButton from './CopyButton';
import Button from './Button';

interface ResultSectionProps {
  status: 'success' | 'pending' | 'error' | 'authentic' | 'not-authentic' | 'unknown';
  title: string;
  tokenOwner?: string;
  imageHash: string;
  creatorPublicKey?: string;
  transactionHash?: string;
  note: string;
}

export default function ResultSection({
  status,
  title,
  tokenOwner,
  imageHash,
  creatorPublicKey,
  transactionHash,
  note
}: ResultSectionProps) {

  const truncateValue = (value: string, length: number = 48) => {
    return `${value.substring(0, length)}...`;
  };

  const getMinaScanUrl = (address: string) => {
    return `https://minascan.io/devnet/account/${address}`;
  };

  const isSuccessState = status === 'success' || status === 'authentic';

  return (
    <div className={`${styles.resultSection} ${styles[status]}`}>
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

        {tokenOwner && (
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Token Owner:</span>
            <div className={styles.resultValueBox}>
              <code className={styles.resultValueText}>
                {truncateValue(tokenOwner)}
              </code>
              <CopyButton text={tokenOwner} title="Copy full address" />
            </div>
          </div>
        )}

        {creatorPublicKey && (
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Creator:</span>
            <div className={styles.resultValueBox}>
              <code className={styles.resultValueText}>
                {truncateValue(creatorPublicKey)}
              </code>
              <CopyButton text={creatorPublicKey} title="Copy creator public key" />
            </div>
          </div>
        )}

        {transactionHash && (
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Transaction Hash:</span>
            <div className={styles.resultValueBox}>
              <code className={styles.resultValueText}>
                {truncateValue(transactionHash)}
              </code>
              <CopyButton text={transactionHash} title="Copy transaction hash" />
            </div>
          </div>
        )}
      </div>

      {(transactionHash || (isSuccessState && tokenOwner)) && (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            href={transactionHash 
              ? `https://minascan.io/devnet/tx/${transactionHash}`
              : getMinaScanUrl(tokenOwner!)}
          >
            View on MinaScan →
          </Button>
        </div>
      )}

      <p className={styles.resultNote}>
        {status === 'pending' && (
          <span className={styles.spinner}></span>
        )}
        {note}
      </p>
    </div>
  );
}