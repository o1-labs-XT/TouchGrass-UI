'use client';
import { useState, useEffect } from 'react';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';
import BackToHomeButton from '../components/BackToHomeButton';
import StatusMessage from '../components/StatusMessage';
import ErrorMessage from '../components/ErrorMessage';
import styles from './submit.module.css';

export default function SubmitPage() {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
    
    setIsProcessing(true);
    setError(null);
    
    try {
      setStatus('Preparing submission...');
      const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
      const worker = new TouchGrassWorkerClient();
      
      setStatus('Generating keypair...');
      const keypair = await worker.generateKeypair();
      
      // Convert blob to buffer for processing
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);
      
      setStatus('Computing image hash...');
      const commitment = await worker.computeOnChainCommitmentWeb(imageBuffer);
      console.log('Image hash:', commitment.sha256Hash);
      
      setStatus('Creating signature...');
      const signature = await worker.signSHA256Hash(
        keypair.privateKeyBase58,
        commitment.sha256Hash
      );
      
      // Create FormData for upload
      setStatus('Submitting image...');
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('publicKey', keypair.publicKeyBase58);
      formData.append('signature', signature.signatureBase58);
      
      // TODO: Replace with real backend endpoint when ready
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      setStatus('Success! Your image has been submitted.');
      console.log('Upload result:', result);
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err instanceof Error ? err.message : 'Submission failed');
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Submit Photo</h1>
        {imageUrl ? (
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
                  Submit to Blockchain
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
        ) : (
          <>
            <CameraCapture onCapture={handleCapture} />
            <BackToHomeButton />
          </>
        )}
      </div>
  );
}