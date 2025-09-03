'use client';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DragDropUpload from '../components/DragDropUpload';
import VerificationDisplay from '../components/VerificationDisplay';
import Button from '../components/Button';
import BackToHomeButton from '../components/BackToHomeButton';
import StatusMessage from '../components/StatusMessage';
import { getTokenOwner } from '../lib/backendClient';
import styles from './verify.module.css';

interface VerificationResult {
  status: 'unknown' | 'authentic' | 'not-authentic';
  sha256Hash: string;
  tokenOwnerAddress?: string;
  creatorPublicKey?: string;
  error?: string;
}

export default function VerifyPage() {
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    dataUrl: string;
    buffer: Uint8Array;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'ready' | 'verifying' | 'complete'>('upload');
  const [status, setStatus] = useState('Upload an image to verify its authenticity');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: File, dataUrl: string, buffer: Uint8Array) => {
    setSelectedImage({ file, dataUrl, buffer });
    setCurrentStep('ready');
    setStatus('Image loaded. Click "Verify Authenticity" to check if this image is authentic.');
    setError(null);
    setResult(null);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setCurrentStep('upload');
    setStatus('Upload an image to verify its authenticity');
    setError(null);
    setResult(null);
  };

  const handleVerifyAuthenticity = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setProcessing(true);
    setCurrentStep('verifying');
    setError(null);

    try {
      setStatus('Computing image commitment...');
      const workerClient = new (await import('../AuthenticityWorkerClient')).default();
      const commitmentResult = await workerClient.computeOnChainCommitmentWeb(selectedImage.buffer);
      console.log('Local commitment computed:', {
        sha256: commitmentResult.sha256Hash.substring(0, 16) + '...',
        poseidon: commitmentResult.poseidonCommitmentString.substring(0, 16) + '...'
      });

      // Get token owner address from backend
      setStatus('Looking up token owner address...');
      const tokenData = await getTokenOwner(commitmentResult.sha256Hash);
      
      // Backend returns {found: false} when image not in system
      if (tokenData.found === false) {
        setResult({
          status: 'unknown',
          sha256Hash: commitmentResult.sha256Hash,
          error: 'Image not found in authenticity system'
        });
        setCurrentStep('complete');
        setStatus('Verification complete: Image not registered in authenticity system');
        return;
      }
      
      if (!tokenData.tokenOwnerAddress) {
        throw new Error('Invalid response: missing token owner address');
      }
      
      console.log('Token owner found:', tokenData.tokenOwnerAddress.substring(0, 16) + '...');

      // Read actual contract state from blockchain
      setStatus('Reading blockchain state...');
      const contractState = await workerClient.readContractState(
        tokenData.tokenOwnerAddress
      );
      
      if (!contractState.isValid) {
        // No zkApp state found or error reading blockchain
        console.error('Failed to read contract state:', contractState.error);
        setResult({
          status: 'unknown',
          sha256Hash: commitmentResult.sha256Hash,
          tokenOwnerAddress: tokenData.tokenOwnerAddress,
          error: contractState.error || 'Failed to read blockchain state'
        });
        setCurrentStep('complete');
        setStatus('Verification incomplete: Could not read blockchain state');
        return;
      }

      console.log('Contract state read:', {
        poseidonHash: contractState.poseidonHash,
        creatorX: contractState.creatorX,
        creatorIsOdd: contractState.creatorIsOdd
      });

      // Compare commitments
      setStatus('Comparing commitments...');
      const localCommitment = commitmentResult.poseidonCommitmentString;
      const onChainCommitment = contractState.poseidonHash;

      console.log('Commitment comparison:', {
        local: localCommitment,
        onChain: onChainCommitment,
        match: localCommitment === onChainCommitment
      });

      const isAuthentic = localCommitment === onChainCommitment;

      // Reconstruct creator public key if authentic
      let creatorPublicKey = '';
      if (isAuthentic) {
        try {
          // Import PublicKey from o1js to reconstruct the full key
          const { PublicKey } = await import('o1js');
          
          // PublicKey.from accepts { x: Field | bigint, isOdd: Bool | boolean }
          // Our contractState values are strings, so convert them
          const creatorPubKey = PublicKey.from({
            x: BigInt(contractState.creatorX),
            isOdd: contractState.creatorIsOdd === '1'
          });
          
          // Convert to base58 for display
          creatorPublicKey = creatorPubKey.toBase58();
          console.log('Reconstructed creator public key:', creatorPublicKey);
        } catch (error) {
          console.error('Failed to reconstruct creator public key:', error);
          // Fallback to showing truncated x-coordinate
          const creatorX = contractState.creatorX || 'unknown';
          creatorPublicKey = `${creatorX.substring(0, 10)}...${creatorX.substring(creatorX.length - 4)}`;
        }
      }

      setResult({
        status: isAuthentic ? 'authentic' : 'not-authentic',
        sha256Hash: commitmentResult.sha256Hash,
        tokenOwnerAddress: tokenData.tokenOwnerAddress,
        creatorPublicKey: creatorPublicKey
      });

      setCurrentStep('complete');
      setStatus(isAuthentic 
        ? 'Verification complete: Image is authentic and unmodified' 
        : 'Verification complete: Image has been modified or is not authentic'
      );

    } catch (error: any) {
      console.error('Verification failed:', error);
      setError(error.message || 'Verification failed. Please try again.');
      setStatus('Verification failed');
      setCurrentStep('ready');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Image Authenticity</title>
        <meta name="description" content="Check if an image is authentic and unmodified"/>
        <link rel="icon" href="/assets/favicon.ico"/>
      </Head>
      <main className={styles.verifyContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Verify Image Authenticity
          </h1>
          <p className={styles.subtitle}>
            Check if an image is authentic and unmodified using blockchain verification
          </p>
        </div>
        
        <div className={styles.uploadSection}>
          {currentStep === 'complete' && result && selectedImage ? (
            <VerificationDisplay
              imageUrl={selectedImage.dataUrl}
              status={result.status}
              imageHash={result.sha256Hash}
              tokenOwner={result.tokenOwnerAddress}
              creatorPublicKey={result.creatorPublicKey}
              error={result.error}
            />
          ) : (
            <DragDropUpload 
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              processing={processing}
              placeholder="Drop your image here to verify"
            />
          )}

          {selectedImage && currentStep !== 'upload' && currentStep !== 'complete' && (
            <div className={styles.imageInfo}>
              <p className={styles.infoText}>
                Image loaded: <strong>{selectedImage.file.name}</strong>
              </p>
              <p className={styles.infoText}>
                Size: {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {currentStep === 'ready' && selectedImage && (
            <div className={styles.actionSection}>
              <Button
                variant="primary"
                onClick={handleVerifyAuthenticity}
                disabled={processing}
              >
                Verify Authenticity
              </Button>
            </div>
          )}

          {(processing || currentStep === 'verifying') && (
            <div className={styles.statusSection}>
              <StatusMessage
                type="processing"
                message={status}
                showSpinner={true}
              />
            </div>
          )}

          {error && (
            <div className={styles.errorSection}>
              <p className={styles.errorText}>{error}</p>
              {currentStep === 'ready' && (
                <Button
                  variant="primary"
                  onClick={handleVerifyAuthenticity}
                  disabled={processing}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

        </div>
        
        <BackToHomeButton />
      </main>
    </>
  );
}