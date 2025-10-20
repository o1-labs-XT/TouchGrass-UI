'use client';

import Card from './Card';
import styles from './WalletChoiceModal.module.css';

interface WalletChoiceModalProps {
  onChooseWallet: () => void;
  onChooseGenerated: () => void;
  isMobile: boolean;
}

export default function WalletChoiceModal({
  onChooseWallet,
  onChooseGenerated,
  isMobile
}: WalletChoiceModalProps) {
  return (
    <div className={styles.overlay}>
      <Card className={styles.modal}>
        <h2 className={styles.title}>Choose Signing Method</h2>
        <button onClick={onChooseWallet}>
          Use Auro Wallet
        </button>
        <button onClick={onChooseGenerated}>
          Continue without wallet
        </button>
      </Card>
    </div>
  );
}
