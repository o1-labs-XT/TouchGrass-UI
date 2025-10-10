'use client';
import { useRef, useState, useEffect } from 'react';
import Button from './Button';
import styles from './CameraCapture.module.css';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
}

const isMobileDevice = (): boolean => {
  // Strongest signal: cannot hover + coarse pointer = definitely mobile
  const cannotHover = window.matchMedia('(hover: none)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  // Backup detection for edge cases
  const mobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 1024;

  // Mobile if strong signal OR backup signals align
  return (cannotHover && hasCoarsePointer) ||
         (mobileUA && hasTouch && isSmallScreen);
};

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  // Detect device type on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const startCamera = async () => {
    try {
      console.log('startCamera called');
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      console.log('Stream obtained:', stream);

      if (videoRef.current) {
        console.log('Setting video srcObject');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        console.log('Camera active state set to true');
      } else {
        console.error('videoRef.current is null');
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please grant camera permissions to take a photo.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to access camera: ' + err.message);
        }
      } else {
        setError('Failed to access camera. Please ensure your browser has camera permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    if (isCameraActive) {
      stopCamera();
      await startCamera();
    }
  };

  const capturePhoto = async () => {
    if (!streamRef.current) return;

    setIsCapturing(true);
    setError(null);

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];

      if (!('ImageCapture' in window)) {
        throw new Error('ImageCapture API not supported. Please use a modern browser.');
      }

      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        setError(`Image too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        setIsCapturing(false);
        return;
      }

      stopCamera();
      onCapture(blob);
    } catch (err) {
      console.error('Failed to capture photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const handleFileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setError(null);
      onCapture(file);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Mobile: Use native camera input
  if (isMobile) {
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

  // Desktop: Use getUserMedia to prevent file uploads
  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {isCameraActive && (
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
          />
        </div>
      )}

      <div className={styles.controls}>
        {!isCameraActive ? (
          <Button variant="primary" onClick={startCamera}>
            Open Camera
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              onClick={capturePhoto}
              disabled={isCapturing}
            >
              {isCapturing ? 'Capturing...' : 'Capture Photo'}
            </Button>
            <Button variant="secondary" onClick={toggleCamera}>
              Flip Camera
            </Button>
            <Button variant="secondary" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}