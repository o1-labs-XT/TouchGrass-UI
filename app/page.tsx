"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GrassyButton from "./components/GrassyButton";
import Card from "./components/Card";
import InfoModal from "./components/InfoModal";
import { useWallet } from "./contexts/WalletContext";
import styles from "./Welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const { setWalletChoice } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAuroWallet = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasWindowMina = typeof window.mina !== "undefined";

    setWalletChoice("auro");

    if (isMobile && !hasWindowMina) {
      // Mobile without window.mina - redirect to AppLinks
      // Include wallet=auro in URL so it survives the redirect to Auro browser
      const returnUrl = window.location.origin + "/challenges?wallet=auro";
      const encodedUrl = encodeURIComponent(returnUrl);
      const networkId = encodeURIComponent("mina:devnet");
      const appLinksUrl = `https://applinks.aurowallet.com/applinks?action=openurl&&networkid=${networkId}&url=${encodedUrl}`;

      console.log('[WelcomePage] Redirecting to Auro AppLinks with wallet=auro in return URL');
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
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '1'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '0.8'}
            title="Learn more about TouchGrass"
          >
            <Image
              src="/assets/question.svg"
              alt="Help"
              width={32}
              height={32}
            />
          </button>
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
            Authentic image challenges powered by Mina Protocol
          </p>

          <ul className={styles.features}>
            <li>
              📸 VERIFIED REAL PHOTOS
            </li>
            <li>
              👍 EARN LIKES
            </li>
            <li>
              💰 GET MINA REWARDS
            </li>
          </ul>

          <div className={styles.buttons}>
            <GrassyButton variant="primary" onClick={handleAuroWallet}>
              Connect Wallet & Start Playing
            </GrassyButton>
            <GrassyButton variant="secondary" onClick={handleWithoutWallet}>
              Continue without wallet
            </GrassyButton>
          </div>
        </Card>
      </div>
      <InfoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
