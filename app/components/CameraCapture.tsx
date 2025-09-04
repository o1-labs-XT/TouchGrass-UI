'use client';
import { useRef } from 'react';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current?.click()}>
        Take Photo
      </button>
      <button onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}