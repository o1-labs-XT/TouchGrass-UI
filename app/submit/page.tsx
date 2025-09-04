'use client';
import { useState } from 'react';
import CameraCapture from '../components/CameraCapture';

export default function SubmitPage() {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const handleCapture = (blob: Blob) => {
    setImageBlob(blob);
    console.log('Captured image:', blob.size, 'bytes');
  };

  const handleCancel = () => {
    setImageBlob(null);
  };

  return (
    <div>
      <h1>Test Camera Capture</h1>
      {imageBlob ? (
        <p>Image captured: {imageBlob.size} bytes</p>
      ) : (
        <CameraCapture onCapture={handleCapture} onCancel={handleCancel} />
      )}
    </div>
  );
}