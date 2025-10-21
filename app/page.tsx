'use client';

import Image from 'next/image';
import Button from './components/Button';
import Card from './components/Card';
import styles from './Welcome.module.css';

export default function WelcomePage() {
  return (
    <main className={styles.container}>
      <div className={styles.background} />
      <div className={styles.wrapper}>
        <Card centered>
          <Image
            src="/assets/touchgrass-logo.png"
            alt="TouchGrass"
            width={64}
            height={64}
            className={styles.logo}
            priority
          />
          <h1 className={styles.title}>TouchGrass</h1>
          <p className={styles.subtitle}>
            Join daily photo challenges and earn rewards for authentic outdoor experiences
          </p>

          <ul className={styles.features}>
            <li>
              <img src="/assets/daly-challenges-icon.svg" alt="" className={styles.featureIcon} />
              DAILY CHALLENGES & COMPETITIONS
            </li>
            <li>
              <img src="/assets/blockchain-rewards-icon.svg" alt="" className={styles.featureIcon} />
              MINA BLOCKCHAIN REWARDS
            </li>
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
