'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentChallenge, getChainsByChallenge, BACKEND_URL } from '../lib/backendClient';
import type { Challenge } from '../lib/backendClient';
import { STATIC_ECDSA_PUBLIC_KEY } from '../lib/staticEcdsaKeys';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import SubmissionCard from '../components/SubmissionCard';
import StatusMessage from '../components/StatusMessage';
import ErrorMessage from '../components/ErrorMessage';
import styles from './submit.module.css';

export default function SubmitPage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get chainId from URL params
    const params = new URLSearchParams(window.location.search);
    const chainIdParam = params.get('chainId');
    if (chainIdParam) {
      setChainId(chainIdParam);
    }

    async function fetchChallengeAndChain() {
      try {
        const challengeData = await getCurrentChallenge();
        setChallenge(challengeData);

        // If no chainId from URL, fetch the default chain for this challenge
        if (!chainIdParam && challengeData) {
          const chains = await getChainsByChallenge(challengeData.id);
          if (chains.length > 0) {
            setChainId(chains[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load challenge:', err);
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
    console.log('Captured image:', blob.size, 'bytes');
  };

  const handleReset = () => {
    setImageBlob(null);
    setImageUrl(null);
    setStatus('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageBlob) return;
    if (!chainId) {
      setError('Chain ID not available. Please try refreshing the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setStatus('Preparing submission...');
      const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
      const worker = new TouchGrassWorkerClient();

      // Generate Mina keypair for wallet address (user identity)
      setStatus('Generating wallet address...');
      const walletKeypair = await worker.generateKeypair();

      // ECDSA signing now handled by server-side API

      // Convert blob to buffer for processing
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);

      setStatus('Computing image hash...');
      const commitment = await worker.computeOnChainCommitmentWeb(imageBuffer);
      console.log('Image hash:', commitment.sha256Hash);

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

      // Create FormData for upload with ECDSA signature components
      setStatus('Submitting image...');
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('walletAddress', walletKeypair.publicKeyBase58);
      formData.append('signatureR', signature.signatureR);
      formData.append('signatureS', signature.signatureS);
      formData.append('publicKeyX', STATIC_ECDSA_PUBLIC_KEY.x);
      formData.append('publicKeyY', STATIC_ECDSA_PUBLIC_KEY.y);
      formData.append('chainId', chainId);

      const response = await fetch(`${BACKEND_URL}/submissions`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setStatus('Success! Your image has been submitted.');
      console.log('Upload result:', result);

      // Redirect to chain detail page after success
      setTimeout(() => {
        router.push(`/chain/${chainId}`);
      }, 2000);
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err instanceof Error ? err.message : 'Submission failed');
      setStatus('');
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
                <div className={styles.buttonGroup}>
                  <Button variant="primary" onClick={handleSubmit}>
                    Submit
                  </Button>
                  <Button variant="primary" onClick={handleReset}>
                    Retake
                  </Button>
                </div>
              )}
              {(isProcessing || status) && (
                <StatusMessage type="processing" message={status} showSpinner={isProcessing} />
              )}
              {error && (
                <ErrorMessage message={error} onDismiss={() => setError(null)} />
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className={styles.container}>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <BackButton onClick={() => router.back()} />
              <h1 className={styles.pageTitle}>Capture Your Challenge Photo</h1>
            </header>

            {challenge && (
              <SubmissionCard className={styles.challengeCard}>
                <h2 className={styles.challengeTitle}>{challenge.title}</h2>
                <p className={styles.challengeDescription}>{challenge.description}</p>
              </SubmissionCard>
            )}

            <SubmissionCard centered className={styles.cameraCard}>
              <div className={styles.cameraIconWrapper}>
                <svg className={styles.cameraIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9Z" stroke="#4CAF50" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="13" r="3.5" stroke="#4CAF50" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <h2 className={styles.cameraTitle}>Take Your Photo</h2>
              <p className={styles.cameraDescription}>
                Use your device's camera to capture an authentic photo for this challenge
              </p>
              <CameraCapture onCapture={handleCapture} />
            </SubmissionCard>
          </div>
        </main>
      )}
    </>
  );
}