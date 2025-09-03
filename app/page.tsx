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
        <title>TouchGrass - Social Photo Challenges</title>
        <meta name="description" content="Complete daily photo challenges and compete with friends on-chain"/>
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
                TouchGrass
              </h1>
              <p className={styles.subtitle}>
                Daily photo challenges on Mina blockchain
              </p>
            </div>
            
            <div className={styles.flowSelection}>
              <Link href="/submit" className={styles.flowCard}>
                <h2>Today's Challenge</h2>
                <p>Complete the daily photo challenge</p>
              </Link>
              
              <Link href="/dashboard" className={styles.flowCard}>
                <h2>Dashboard</h2>
                <p>View submissions and leaderboard</p>
              </Link>
            </div>
          </main>
      </GradientBG>
    </>
  );
}
