"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ScreenshotterProps {
  videoFile: File;
  timestamp: number;
  altText: string;
}

export function VideoScreenshotter({ videoFile, timestamp, altText }: ScreenshotterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State to hold the "Confirmed" image and the "Candidate" images
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to middle (T)

  // Generate 3 frames: T-1.5s, T, T+1.5s
  const generateCandidates = async () => {
    if (!videoFile || isGenerating) return;
    setIsGenerating(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;
    
    // Offsets to capture: Early, On-Time, Late
    const offsets = [-1.5, 0, 1.5]; 
    const newCandidates: string[] = [];

    for (const offset of offsets) {
      // Calculate safe time (not below 0, not above duration)
      let seekTime = timestamp + offset;
      if (seekTime < 0) seekTime = 0;
      
      // Promise wrapper to wait for seek
      await new Promise<void>((resolve) => {
        video.currentTime = seekTime;
        const onSeek = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                newCandidates.push(canvas.toDataURL('image/jpeg', 0.7));
            }
            video.removeEventListener('seeked', onSeek);
            resolve();
        };
        video.addEventListener('seeked', onSeek);
      });
    }

    setCandidates(newCandidates);
    setConfirmedImage(newCandidates[1]); // Default to middle frame
    setIsGenerating(false);
    URL.revokeObjectURL(fileUrl);
  };

  // Trigger generation on mount or when timestamp changes
  useEffect(() => {
    // Reset state when timestamp changes
    setCandidates([]);
    setConfirmedImage(null);
    setSelectedIndex(1);
    setIsGenerating(false);
    
    // Generate new candidates with new timestamp
    generateCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile, timestamp]);

  // If we are printing, just show the confirmed image
  if (typeof window !== 'undefined' && window.matchMedia('print').matches) {
     return confirmedImage ? <img src={confirmedImage} alt={altText} className="w-full h-auto" /> : null;
  }

  return (
    <div className="mt-4 mb-6 group">
      {/* Hidden Workers */}
      <video ref={videoRef} className="hidden" muted playsInline crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />

      {isGenerating ? (
        <div className="h-32 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />
          <span className="text-xs text-slate-400">Finding best frame...</span>
        </div>
      ) : (
        <div className="space-y-3">
            {/* Main Display Image */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={candidates[selectedIndex] || confirmedImage || ""} alt={altText} className="w-full h-auto object-cover" />
                
                {/* Hover Overlay to Edit */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 print:hidden">
                    <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg flex gap-2 items-center">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                            disabled={selectedIndex === 0}
                            onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium w-20 text-center">
                            {selectedIndex === 0 ? "Earlier" : selectedIndex === 1 ? "Original" : "Later"}
                        </span>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            disabled={selectedIndex === 2}
                            onClick={() => setSelectedIndex(Math.min(2, selectedIndex + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
