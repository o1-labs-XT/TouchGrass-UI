"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getCurrentChallenge,
  getChain,
  getChallenge,
  getChainsByChallenge,
  BACKEND_URL
} from "../lib/backendClient";
import type { Challenge } from "../lib/backendClient";
import CameraCapture from "../components/CameraCapture";
import GrassyButton from "../components/GrassyButton";
import BackButton from "../components/BackButton";
import SubmissionCard from "../components/SubmissionCard";
import StatusMessage from "../components/StatusMessage";
import ErrorMessage from "../components/ErrorMessage";
import WalletStatus from "../components/WalletStatus";
import { useWallet } from "../contexts/WalletContext";
import styles from "./submit.module.css";
import { STATIC_ECDSA_PUBLIC_KEY } from "../lib/staticEcdsaKeys";

function getTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const hoursLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);

  return hoursLeft >= 24 ? `${daysLeft} Days left` : `${hoursLeft} H left`;
}

export default function SubmitPage() {
  const router = useRouter();
  const {
    walletChoice,
    isConnected,
    isConnecting,
    address,
    signFields,
    reconnect
  } = useWallet();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "[SubmitPage] Mounted. walletChoice:",
      walletChoice,
      "isConnected:",
      isConnected
    );

    if (walletChoice === "auro" && !isConnected && !isConnecting) {
      console.log("[SubmitPage] Triggering auto-connect to Auro wallet...");
      reconnect();
    }
  }, [walletChoice, isConnected, isConnecting, reconnect]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chainIdParam = params.get("chainId");
    const challengeIdParam = params.get("challengeId");

    if (chainIdParam) {
      setChainId(chainIdParam);
    }

    async function fetchChallengeAndChain() {
      try {
        if (challengeIdParam) {
          const challengeData = await getChallenge(challengeIdParam);
          setChallenge(challengeData);
        } else if (chainIdParam) {
          const chainData = await getChain(chainIdParam);
          const challengeData = await getChallenge(chainData.challengeId);
          setChallenge(challengeData);
        } else {
          const challengeData = await getCurrentChallenge();
          setChallenge(challengeData);

          const chains = await getChainsByChallenge(challengeData.id);
          if (chains.length > 0) {
            setChainId(chains[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load challenge:", err);
      }
    }
    fetchChallengeAndChain();
  }, []);

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageBlob]);

  const handleCapture = (blob: Blob) => {
    setImageBlob(blob);
    console.log("Captured image:", blob.size, "bytes");
  };

  const handleReset = () => {
    setImageBlob(null);
    setImageUrl(null);
    setTagline("");
    setStatus("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageBlob) return;
    if (!chainId) {
      setError("Chain ID not available. Please try refreshing the page.");
      return;
    }

    if (!walletChoice) {
      setError("Please select a signing method from the welcome page");
      return;
    }

    // For Auro wallet, check connection
    console.log("[DEBUG] Wallet validation:", {
      walletChoice,
      isConnected,
      address
    });
    if (walletChoice === "auro" && (!isConnected || !address)) {
      setError("Please connect your Auro Wallet first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setStatus("Preparing submission...");
      console.log("[1/7] Preparing submission");
      const TouchGrassWorkerClient = (await import("../TouchGrassWorkerClient"))
        .default;
      const worker = new TouchGrassWorkerClient();

      // ECDSA signing now handled by server-side API

      // Convert blob to buffer for processing
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);

      setStatus("Computing image hash...");
      console.log("[3/7] Computing image hash");
      const commitment = await worker.computeOnChainCommitmentWeb(imageBuffer);
      console.log("[3/7] Image hash:", commitment.sha256Hash);

      setStatus('Creating ECDSA signature...');
      const signResponse = await fetch('/api/sign-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha256Hash: commitment.sha256Hash
        })
      });

      if (!signResponse.ok) {
        throw new Error('Failed to generate signature');
      }

      const signature = await signResponse.json();

      // Sign with wallet choice
      let walletSignResult: { signature: string } | undefined;
      let minaPublicKey: string | null = null;

      if (walletChoice === "auro") {
        // Sign with Auro Wallet
        setStatus("Please approve signature in Auro Wallet...");
        console.log("[5/7] Requesting Auro wallet signature");
        const fieldMessage = [
          commitment.high128String,
          commitment.low128String
        ];
        try {
          walletSignResult = await signFields(fieldMessage);
          minaPublicKey = address;
          console.log("[5/7] Auro signature received:", walletSignResult);
        } catch (err: any) {
          console.error("[5/7] Wallet signature failed:", err);
          throw new Error(err.message || "Wallet signature rejected");
        }
      } else if (walletChoice === "generated") {
        // Sign with generated keypair
        const keypairData = localStorage.getItem("minaKeypair");

        if (!keypairData) {
          console.error("[5/7] No keypair found - wallet not ready");
          throw new Error("Wallet not ready. Please refresh and try again.");
        }

        console.log("[5/7] Using existing Mina keypair from localStorage");
        const minaKeypair = JSON.parse(keypairData);

        setStatus("Signing with generated keypair...");
        console.log("[5/7] Signing with generated keypair");
        const fieldMessage = [
          commitment.high128String,
          commitment.low128String
        ];
        const signResult = await worker.signFieldsMinaSigner(
          minaKeypair.privateKey,
          fieldMessage
        );

        walletSignResult = { signature: signResult.signature };
        minaPublicKey = signResult.publicKey;
        console.log("[5/7] Generated keypair signature created");
      } else {
        throw new Error("Invalid wallet choice");
      }

      if (!walletSignResult || !minaPublicKey) {
        throw new Error("Failed to sign with wallet");
      }

      // Create FormData for upload with both ECDSA and Mina signatures
      setStatus("Submitting image...");
      console.log("[6/7] Building form data");
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('walletAddress', minaPublicKey);
      formData.append('signatureR', signature.signatureR);
      formData.append('signatureS', signature.signatureS);
      formData.append('publicKeyX', STATIC_ECDSA_PUBLIC_KEY.x);
      formData.append('publicKeyY', STATIC_ECDSA_PUBLIC_KEY.y);
      formData.append('chainId', chainId);
      if (tagline.trim()) {
        formData.append('tagline', tagline.trim());
      }

      const response = await fetch(`${BACKEND_URL}/submissions`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[6/7] Upload failed:", {
          status: response.status,
          body: errorText
        });
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log("[7/7] Upload successful!", result);

      // Check if we're in Auro browser (mobile flow)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isInAuroBrowser = isMobile && typeof window.mina !== "undefined";

      setStatus("Success! Your image has been submitted.");
      // Redirect to chain detail page after success
      setTimeout(() => {
        router.push(`/chain/${chainId}`);
      }, 2000);
    } catch (err) {
      console.error("Submission failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Submission failed";
      setError(errorMessage);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {imageUrl ? (
        <main className={styles.container}>
          <div className={styles.wrapper}>
            <h1 className={styles.pageTitle}>Submit Photo</h1>
            <div className={styles.previewContainer}>
              <div className={styles.imageWrapper}>
                <img
                  src={imageUrl}
                  alt="Captured photo"
                  className={styles.capturedImage}
                />
              </div>
              {!isProcessing && !status && (
                <div className={styles.taglineContainer}>
                  <label htmlFor="tagline" className={styles.taglineLabel}>
                    Add a tagline (optional)
                  </label>
                  <textarea
                    id="tagline"
                    className={styles.taglineInput}
                    placeholder="Share your thoughts about this moment..."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    onFocus={(e) => {
                      setTimeout(() => {
                        const yOffset = -100;
                        const element = e.target;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }, 600);
                    }}
                    maxLength={200}
                    rows={3}
                  />
                  <div className={styles.charCount}>
                    {tagline.length}/200
                  </div>
                </div>
              )}
              {!isProcessing && !status && (
                <div className={styles.buttonGroup}>
                  <GrassyButton
                    variant="primary"
                    size="short"
                    onClick={handleSubmit}
                    disabled={walletChoice === "auro" && isConnecting}
                  >
                    {walletChoice === "auro" && isConnecting
                      ? "Connecting wallet..."
                      : "Submit"}
                  </GrassyButton>
                  <GrassyButton variant="secondary" size="short" onClick={handleReset}>
                    Retake
                  </GrassyButton>
                </div>
              )}
              {(isProcessing || status) && (
                <StatusMessage
                  type="processing"
                  message={status}
                  showSpinner={isProcessing}
                />
              )}
              {error && (
                <ErrorMessage
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className={styles.container}>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <BackButton onClick={() => router.push('/challenges')} />
              <WalletStatus />
            </header>

            <SubmissionCard centered className={styles.cameraCard}>
              <h1 className={styles.pageTitle}>
                <Image
                  src="/assets/camera-icon-small.svg"
                  alt="Camera"
                  width={20}
                  height={20}
                  style={{ marginRight: '0.5rem' }}
                />
                Capture Your Challenge Photo
              </h1>
              <div className={styles.challengeInfo}>
                <div className={styles.challengeImageWrapper}>
                  <Image
                    src="/assets/landing-page-y2k.webp"
                    alt={challenge?.title || "Challenge"}
                    fill
                    priority
                    className={styles.challengeImage}
                  />
                </div>
                {challenge && (
                  <div className={styles.challengeContent}>
                    <h2 className={styles.challengeTitle}>{challenge.title}</h2>
                    <p className={styles.challengeDescription}>
                      {challenge.description}
                    </p>
                    <p className={styles.challengeTimeRemaining}>
                      <Image
                        src="/assets/clock-icon.svg"
                        alt="Time"
                        width={16}
                        height={16}
                        style={{ marginRight: '0.25rem' }}
                      />
                      {getTimeRemaining(challenge.endTime)}
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.cameraSection}>
                <Image
                  src="/assets/grassy-camera.svg"
                  alt="Camera"
                  width={80}
                  height={80}
                  className={styles.cameraIcon}
                />
                <h2 className={styles.cameraTitle}>Take Your Photo</h2>
                <p className={styles.cameraDescription}>
                  Use your device's camera to capture an authentic photo for this
                  challenge
                </p>
                <CameraCapture onCapture={handleCapture} />
              </div>
            </SubmissionCard>
          </div>
        </main>
      )}
    </>
  );
}
