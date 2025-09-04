'use client';
import { useRef, useState } from 'react';
import Button from './Button';
import styles from './CameraCapture.module.css';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        // Clear the input so user can try again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setError(null);
      onCapture(file);
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        style={{ display: 'none' }}
      />
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
      <div className={styles.controls}>
        <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
          Take Photo
        </Button>
      </div>
    </div>
  );
}