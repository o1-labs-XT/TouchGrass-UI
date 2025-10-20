'use client';

import Button from './Button';
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

        <div className={styles.options}>
          <Button variant="primary" onClick={onChooseWallet}>
            Use Auro Wallet
          </Button>

          <Button variant="secondary" onClick={onChooseGenerated}>
            Continue without wallet
          </Button>
        </div>
      </Card>
    </div>
  );
}
