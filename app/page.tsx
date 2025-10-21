'use client';

import Button from './components/Button';
import Card from './components/Card';
import styles from './Welcome.module.css';

export default function WelcomePage() {
  return (
    <main className={styles.container}>
      <div className={styles.background} />
      <div className={styles.wrapper}>
        <Card centered>
          <img
            src="/assets/touchgrass-logo.png"
            alt="TouchGrass"
            className={styles.logo}
          />
          <h1 className={styles.title}>TouchGrass</h1>
          <p className={styles.subtitle}>
            Capture authentic moments, verified on-chain
          </p>

          <ul className={styles.features}>
            <li>C2PA image verification</li>
            <li>MINA blockchain integration</li>
            <li>Weekly challenges</li>
          </ul>

          <div className={styles.buttons}>
            <Button variant="primary">
              Use Auro Wallet
            </Button>
            <Button variant="secondary">
              Continue without wallet
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
