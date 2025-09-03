'use client';
import { useState, useCallback, useRef } from 'react';
import styles from './DragDropUpload.module.css';

interface DragDropUploadProps {
  onImageSelect: (file: File, dataUrl: string, buffer: Uint8Array) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
  processing?: boolean;
  placeholder?: string;
  theme?: 'default' | 'blue' | 'green';
}

export default function DragDropUpload({ 
  onImageSelect,
  onImageRemove,
  disabled = false,
  processing = false,
  placeholder = "Drop your image here",
  theme = 'default'
}: DragDropUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        setFileName(file.name);
        
        // Convert to Uint8Array for processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // Call parent callback
        onImageSelect(file, dataUrl, buffer);
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process file');
      console.error('File processing error:', err);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || processing) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled, processing]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !processing) {
      setDragActive(true);
    }
  }, [disabled, processing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only deactivate if leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragActive(false);
    }
  }, []);

  const handleClick = () => {
    if (!disabled && !processing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent component to clear its state
    onImageRemove?.();
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.fileInput}
        disabled={disabled || processing}
      />

      <div 
        className={`
          ${styles.dropArea} 
          ${theme === 'blue' ? styles.blueTheme : ''}
          ${theme === 'green' ? styles.greenTheme : ''}
          ${dragActive ? styles.dragActive : ''} 
          ${disabled || processing ? styles.disabled : ''}
          ${preview ? styles.hasPreview : ''}
          ${error ? styles.error : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {preview ? (
          <div className={styles.previewContainer}>
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <div className={styles.previewOverlay}>
              <div className={styles.previewInfo}>
                <p className={styles.fileName}>{fileName}</p>
                {!processing && !disabled && (
                  <button 
                    onClick={handleRemove}
                    className={styles.removeButton}
                    type="button"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <div className={styles.uploadIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className={styles.uploadText}>
              {dragActive ? 'Drop it here!' : placeholder}
            </p>
            <p className={styles.uploadHint}>
              or click to browse
            </p>
            <p className={styles.uploadSupport}>
              Supports: JPG, PNG, GIF (max 10MB)
            </p>
          </div>
        )}

        {processing && (
          <div className={styles.processingOverlay}>
            <div className={styles.spinner} />
            <p className={styles.processingText}>Processing...</p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}