"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ScreenshotterProps {
  videoFile: File;
  timestamp: number;
  altText: string;
}

export function VideoScreenshotter({ videoFile, timestamp, altText }: ScreenshotterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoFile || imageUrl) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.currentTime = timestamp; // Seek to the step time

    video.onseeked = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(fileUrl); // Cleanup
      }
    };
  }, [videoFile, timestamp]);

  return (
    <>
      <video ref={videoRef} className="hidden" preload="metadata" />
      <canvas ref={canvasRef} className="hidden" />
      {imageUrl ? (
        <div className="mt-3 mb-4 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
          <img src={imageUrl} alt={altText} className="w-full h-auto object-cover" />
        </div>
      ) : (
        <div className="h-32 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
    </>
  );
}

