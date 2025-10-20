'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentChallenge, getChainsByChallenge, BACKEND_URL } from '../lib/backendClient';
import type { Challenge } from '../lib/backendClient';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import StatusMessage from '../components/StatusMessage';
import ErrorMessage from '../components/ErrorMessage';
import WalletStatus from '../components/WalletStatus';
import { useAuroWallet } from '../hooks/useAuroWallet';
import styles from './submit.module.css';

export default function SubmitPage() {
  const router = useRouter();
  const { isConnected, address, signFields } = useAuroWallet();
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

    // Check if we need to redirect to Auro browser on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasWindowMina = typeof window.mina !== 'undefined';

    if (isMobile && !hasWindowMina) {
      // Redirect to AppLinks to open in Auro browser
      const currentUrl = window.location.href;
      const encodedUrl = encodeURIComponent(currentUrl);
      const networkId = encodeURIComponent('mina:devnet');
      const appLinksUrl = `https://applinks.aurowallet.com/applinks?action=openurl&networkid=${networkId}&url=${encodedUrl}`;

      setStatus(`Redirecting to Auro in 10 seconds...\n\nGenerated URL:\n${appLinksUrl}`);

      setTimeout(() => {
        window.location.href = appLinksUrl;
      }, 10000);
      return;
    }

    // Check wallet connection
    if (!isConnected || !address) {
      setError('Please connect your Auro Wallet first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setStatus('Preparing submission...');
      console.log('[1/7] Preparing submission');
      const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
      const worker = new TouchGrassWorkerClient();

      // Generate ECDSA keypair for image signing
      setStatus('Generating signing keypair...');
      console.log('[2/7] Generating ECDSA keypair');
      const ecKeypair = await worker.generateECKeypair();
      console.log('[2/7] Keypair generated');

      // Convert blob to buffer for processing
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);

      setStatus('Computing image hash...');
      console.log('[3/7] Computing image hash');
      const commitment = await worker.computeOnChainCommitmentWeb(imageBuffer);
      console.log('[3/7] Image hash:', commitment.sha256Hash);

      setStatus('Creating ECDSA signature...');
      console.log('[4/7] Creating ECDSA signature');
      const signature = await worker.signECDSA(
        ecKeypair.privateKeyHex,
        commitment.sha256Hash
      );
      console.log('[4/7] ECDSA signature created');

      // Sign Field elements with Auro Wallet
      setStatus('Please approve signature in Auro Wallet...');
      console.log('[5/7] Requesting Auro wallet signature');
      const fieldMessage = [commitment.high128String, commitment.low128String];
      let walletSignResult;
      try {
        walletSignResult = await signFields(fieldMessage);
        console.log('[5/7] Auro signature received:', walletSignResult);
      } catch (err: any) {
        console.error('[5/7] Wallet signature failed:', err);
        throw new Error(err.message || 'Wallet signature rejected');
      }

      // Create FormData for upload with both ECDSA and Auro wallet signatures
      setStatus('Submitting image...');
      console.log('[6/7] Building form data');
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('walletAddress', address);
      formData.append('walletSignature', walletSignResult.signature);
      formData.append('signatureR', signature.signatureR);
      formData.append('signatureS', signature.signatureS);
      formData.append('publicKeyX', ecKeypair.publicKeyXHex);
      formData.append('publicKeyY', ecKeypair.publicKeyYHex);
      formData.append('chainId', chainId);
      console.log('[6/7] Form data ready, uploading to:', BACKEND_URL);

      const response = await fetch(`${BACKEND_URL}/submissions`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[6/7] Upload failed:', { status: response.status, body: errorText });
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[7/7] Upload successful!', result);
      setStatus('Success! Your image has been submitted.');

      // Redirect to chain detail page after success
      setTimeout(() => {
        router.push(`/chain/${chainId}`);
      }, 2000);
    } catch (err) {
      console.error('Submission failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      const stackTrace = err instanceof Error && err.stack ? `\n\nStack:\n${err.stack}` : '';
      setError(errorMessage + stackTrace);
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {imageUrl ? (
        <div className={styles.container}>
          <h1 className={styles.title}>Submit Photo</h1>
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
      ) : (
        <main className={styles.container}>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <BackButton onClick={() => router.back()} />
              <h1 className={styles.pageTitle}>Capture Your Challenge Photo</h1>
              <WalletStatus />
            </header>

            {challenge && (
              <Card className={styles.challengeCard}>
                <h2 className={styles.challengeTitle}>{challenge.title}</h2>
                <p className={styles.challengeDescription}>{challenge.description}</p>
              </Card>
            )}

            <Card centered className={styles.cameraCard}>
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
            </Card>
          </div>
        </main>
      )}
    </>
  );
}