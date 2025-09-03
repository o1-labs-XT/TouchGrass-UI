'use client';
import styles from './VerificationDisplay.module.css';
import ResultSection from './ResultSection';

interface VerificationDisplayProps {
  imageUrl: string;
  status: 'unknown' | 'authentic' | 'not-authentic';
  imageHash: string;
  tokenOwner?: string;
  creatorPublicKey?: string;
  error?: string;
}

export default function VerificationDisplay({
  imageUrl,
  status,
  imageHash,
  tokenOwner,
  creatorPublicKey,
  error
}: VerificationDisplayProps) {
  const getStatusTitle = () => {
    switch (status) {
      case 'authentic':
        return 'Image is Authentic';
      case 'not-authentic':
        return 'Image is Not Authentic';
      case 'unknown':
        return 'Image Not Found';
      default:
        return 'Verification Status Unknown';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'authentic':
        return 'This image has not been modified and matches the on-chain record.';
      case 'not-authentic':
        return 'This image has been modified or does not match the on-chain record.';
      case 'unknown':
        return error || 'Image not found in authenticity system';
      default:
        return 'Unable to determine authenticity status.';
    }
  };

  return (
    <div className={styles.verificationContainer}>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt="Verified image" className={styles.verifiedImage} />
        
        {/* Visual overlay on the image */}
        <div className={`${styles.overlay} ${styles[status]}`}>
          <div className={styles.overlayContent}>
            <span className={styles.overlayIcon}>
              {status === 'authentic' && '✓'}
              {status === 'not-authentic' && '❌'}
              {status === 'unknown' && '❓'}
            </span>
            <span className={styles.overlayText}>
              {status === 'authentic' && 'AUTHENTIC'}
              {status === 'not-authentic' && 'NOT AUTHENTIC'}
              {status === 'unknown' && 'UNKNOWN'}
            </span>
          </div>
        </div>
      </div>

      <ResultSection
        status={status}
        title={getStatusTitle()}
        tokenOwner={tokenOwner}
        imageHash={imageHash}
        creatorPublicKey={creatorPublicKey}
        note={getStatusMessage()}
      />
    </div>
  );
}