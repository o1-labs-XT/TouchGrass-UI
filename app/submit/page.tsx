'use client';
import { useState, useEffect } from 'react';
import CameraCapture from '../components/CameraCapture';
import Button from '../components/Button';

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
    <div style={{ padding: '1rem' }}>
      <h1>Submit Photo</h1>
      {imageUrl ? (
        <div>
          <img 
            src={imageUrl} 
            alt="Captured" 
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <Button variant="primary">Submit to Blockchain</Button>
            <Button variant="secondary" onClick={handleReset}>Retake</Button>
          </div>
        </div>
      ) : (
        <CameraCapture onCapture={handleCapture} onCancel={() => window.history.back()} />
      )}
    </div>
  );
}