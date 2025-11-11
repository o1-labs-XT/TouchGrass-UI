"use client";

import React from "react";
import styles from "./InfoModal.module.css";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={styles.closeButton}
        >
          ×
        </button>
        <div className={styles.content}>
          <h2 className={styles.title}>About</h2>
          <p className={styles.text}>
            TouchGrass lets you join fun photo challenges where every image is proven real — no AI, no filters, no fakes. Just snap, prove, and share.
          </p>
          <br/>
          <p className={styles.text}>
            Built on <strong>Mina Protocol</strong>, TouchGrass gives you a glimpse into a future where all digital content can be cryptographically verified as authentic.
          </p>
          <br/>
          <p className={styles.text}>
            It's a sneak peek at what's coming: cameras and sensors attaching proofs and signatures to everything they capture, all anchored securely on Mina — the global proof settlement layer for verifiable apps.
          </p>
          <h3 className={styles.subtitle}>How to get started?</h3>
          <h4 className={styles.stepTitle}>1️⃣ Choose how to play</h4>
          <ul className={styles.list}>
            <li><strong>Quick Mode:</strong> Tap "Continue without wallet" to jump right in.<br />
            → We'll create a secure key in your browser and store it locally (no setup needed).
            </li>
            <li><strong>Full Mode:</strong> Want rewards or to test Mina on-chain?<br />
                → Install <a href="https://www.aurowallet.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>Auro Wallet</a> on your mobile phone, then tap "Connect Wallet & Start Playing."<br />
                <em>*If Auro opens without showing TouchGrass, try tapping the link again from your default browser.</em></li>
          </ul>

          <h4 className={styles.stepTitle}>2️⃣ Join a Challenge</h4>
          <p className={styles.text}>
            Pick a live challenge and upload your photo.<br />
            You'll need to post at least one photo before you can start liking others.
          </p>

          <h4 className={styles.stepTitle}>3️⃣ Have Fun 🌱</h4>
          <p className={styles.text}>
            Explore, like your favorite posts, and share your own!<br />
            Photos with 100+ likes are eligible for rewards 🎁
          </p>

          <h3 className={styles.subtitle}>What is really happening when I upload a photo?</h3>
          <p className={styles.text}>
            Every image you post gets signed in the browser - proving it was really taken by you. In the backend, we verify the signature against the actual content submitted to confirm the match, and then submit that proof to a smart contract on Mina. Mina stores the SHA-256 hash and ECDSA signature in a token account that functions kind of like a soulbound NFT.
          </p>
          <p className={styles.text}>
            Want the technical details?<br />
            👉 <a href="#" className={styles.link}>Read the code →</a>
          </p>

          <h3 className={styles.subtitle}>This is cool! How can I get in touch with the team?</h3>
          <p className={styles.text}>
            Come chat us up at Devconnect! If you see the Grassman, a team member should be closeby!
          </p>
          <p className={styles.text}>
            After the event, join us on:
          </p>
          <ul className={styles.list}>
            <li><a href="#" className={styles.link}>Discord↗</a> to chat</li>
            <li><a href="#" className={styles.link}>X (Twitter)↗</a> for updates</li>
            <li>or <a href="#" className={styles.link}>submit a Grant Proposal↗</a> to collaborate on future experiments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}