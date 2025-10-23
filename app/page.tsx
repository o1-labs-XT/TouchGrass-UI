"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "./components/Button";
import GrassyButton from "./components/GrassyButton";
import Card from "./components/Card";
import { useWallet } from "./contexts/WalletContext";
import styles from "./Welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const { setWalletChoice } = useWallet();

  const handleAuroWallet = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasWindowMina = typeof window.mina !== "undefined";

    setWalletChoice("auro");

    if (isMobile && !hasWindowMina) {
      // Mobile without window.mina - redirect to AppLinks
      const returnUrl = window.location.origin + "/challenges";
      const encodedUrl = encodeURIComponent(returnUrl);
      const networkId = encodeURIComponent("mina:devnet");
      const appLinksUrl = `https://applinks.aurowallet.com/applinks?action=openurl&&networkid=${networkId}&url=${encodedUrl}`;

      window.location.href = appLinksUrl;
    } else {
      // Already in Auro browser or desktop - navigate directly
      router.push("/challenges");
    }
  };

  const handleWithoutWallet = () => {
    setWalletChoice("generated");
    router.push("/challenges");
  };

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
            Join daily photo challenges and earn rewards for authentic outdoor
            experiences
          </p>

          <ul className={styles.features}>
            <li>
              <img
                src="/assets/daly-challenges-icon.svg"
                alt=""
                className={styles.featureIcon}
              />
              DAILY CHALLENGES & COMPETITIONS
            </li>
            <li>
              <img
                src="/assets/blockchain-rewards-icon.svg"
                alt=""
                className={styles.featureIcon}
              />
              MINA BLOCKCHAIN REWARDS
            </li>
          </ul>

          <div className={styles.buttons}>
            <GrassyButton variant="primary" onClick={handleAuroWallet}>
              Connect Wallet & Start Playing
            </GrassyButton>
            <Button variant="primary" onClick={handleWithoutWallet}>
              Continue without wallet
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
