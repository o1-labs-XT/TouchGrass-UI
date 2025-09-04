'use client';
import { useState, useEffect } from 'react';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';
import GradientBG from '../components/GradientBG';
import styles from './submit.module.css';

export default function SubmitPage() {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
  };

  return (
    <GradientBG>
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
            <div className={styles.buttonGroup}>
              <Button variant="primary">Submit to Blockchain</Button>
              <Button variant="secondary" onClick={handleReset}>Retake</Button>
            </div>
          </div>
        ) : (
          <CameraCapture onCapture={handleCapture} onCancel={() => window.history.back()} />
        )}
      </div>
    </GradientBG>
  );
}