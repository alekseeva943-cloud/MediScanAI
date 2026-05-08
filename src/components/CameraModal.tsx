import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { Button } from './UI';
import { motion, AnimatePresence } from 'motion/react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
}

export const CameraModal = ({ isOpen, onClose, onCapture }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Нет доступа к камере. Убедитесь, что вы дали разрешение.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      >
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
          <span className="font-semibold">Камера</span>
          <button onClick={toggleFacingMode} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RefreshCw size={24} />
          </button>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-400">
              <p>{error}</p>
              <Button variant="secondary" className="mt-4" onClick={startCamera}>Попробовать снова</Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 pb-12 flex justify-center items-center bg-black/50 backdrop-blur-md absolute bottom-0 left-0 right-0">
          <button
            onClick={captureImage}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
