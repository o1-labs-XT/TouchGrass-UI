'use client';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../public/assets/hero-mina-logo.svg';
import GradientBG from './components/GradientBG';

export default function Home() {
  return (
    <>
      <Head>
        <title>Image Authenticity Verification</title>
        <meta name="description" content="Prove and verify image authenticity using zero-knowledge proofs"/>
        <link rel="icon" href="/assets/favicon.ico"/>
      </Head>
      <GradientBG>
        <main className={styles.main}>
            <div className={styles.center}>
              <Image
                className={styles.logo}
                src={heroMinaLogo}
                alt="Mina Logo"
                width="191"
                height="174"
                priority
              />
              <h1 className={styles.title}>
                Image Authenticity Verification
              </h1>
              <p className={styles.subtitle}>
                Powered by Mina Protocol and Zero-Knowledge Proofs
              </p>
            </div>
            
            <div className={styles.flowSelection}>
              <Link href="/prove" className={styles.flowCard}>
                <h2>Prove Authenticity</h2>
                <p>Upload and certify your original images on-chain</p>
              </Link>
              
              <Link href="/verify" className={styles.flowCard}>
                <h2>Verify Image</h2>
                <p>Check if an image is authentic and unmodified</p>
              </Link>
            </div>
          </main>
      </GradientBG>
    </>
  );
}
