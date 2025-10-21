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
            Join daily photo challenges and earn rewards for authentic outdoor experiences
          </p>

          <ul className={styles.features}>
            <li data-icon="○">C2PA VERIFIED AUTHENTICITY</li>
            <li data-icon="▢">MINA BLOCKCHAIN REWARDS</li>
            <li data-icon="🏆">DAILY CHALLENGES & COMPETITIONS</li>
          </ul>

          <div className={styles.buttons}>
            <Button variant="primary">
              Use Auro Wallet
            </Button>
            <Button variant="primary">
              Continue without wallet
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
