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

const compressImage = async (
  blob: Blob,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG blob
      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Log compression results
          const originalSizeKB = (blob.size / 1024).toFixed(1);
          const compressedSizeKB = (compressedBlob.size / 1024).toFixed(1);
          const ratio = (blob.size / compressedBlob.size).toFixed(1);
          console.log(`Compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${ratio}x reduction)`);

          resolve(compressedBlob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
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
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
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

      // Compress image before submitting
      const compressedBlob = await compressImage(blob);

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (compressedBlob.size > maxSize) {
        setError(`Image too large (${(compressedBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        setIsCapturing(false);
        return;
      }

      stopCamera();
      onCapture(compressedBlob);
    } catch (err) {
      console.error('Failed to capture photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Compress image before submitting
        const compressedBlob = await compressImage(file);

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (compressedBlob.size > maxSize) {
          setError(`Image too large (${(compressedBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        setError(null);
        onCapture(compressedBlob);
      } catch (err) {
        console.error('Failed to compress image:', err);
        setError(err instanceof Error ? err.message : 'Failed to process image');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
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

      <div className={styles.videoContainer} style={{ display: isCameraActive ? 'block' : 'none' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.video}
        />
      </div>

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
              {isCapturing ? 'Capturing...' : 'Capture'}
            </Button>
            <Button variant="primary" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}