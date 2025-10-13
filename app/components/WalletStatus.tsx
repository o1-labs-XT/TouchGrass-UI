'use client';
import { useAuroWallet } from '../hooks/useAuroWallet';
import Button from './Button';
import styles from './WalletStatus.module.css';

export default function WalletStatus() {
  const { isInstalled, isConnecting, isConnected, address, error, reconnect } = useAuroWallet();

  // Don't show anything while checking
  if (!isInstalled && !error) {
    return null;
  }

  // Wallet not installed
  if (!isInstalled) {
    return (
      <div className={styles.walletStatus}>
        <Button
          variant="secondary"
          href="https://www.aurowallet.com/"
          className={styles.compactButton}
        >
          Install Auro Wallet
        </Button>
      </div>
    );
  }

  // Connecting
  if (isConnecting) {
    return (
      <div className={styles.walletStatus}>
        <span className={styles.connecting}>Connecting...</span>
      </div>
    );
  }

  // Connected
  if (isConnected && address) {
    return (
      <div className={styles.walletStatus}>
        <div className={styles.connected}>
          <span className={styles.dot}>●</span>
          <span className={styles.address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </div>
    );
  }

  // Not connected - show Connect Wallet button
  return (
    <div className={styles.walletStatus}>
      <Button
        variant="clean"
        onClick={reconnect}
        className={styles.compactButton}
      >
        Connect Wallet
      </Button>
    </div>
  );
}
