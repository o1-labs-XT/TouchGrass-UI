'use client';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  return (
    <div>
      <p>Camera Capture Component</p>
    </div>
  );
}