"use client";

import { SopSchema } from "@/types/sop";
import { VideoScreenshotter } from "./VideoScreenshotter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, AlertTriangle, Clock } from "lucide-react";

interface SopDisplayProps {
  data: SopSchema;
  videoFile?: File; // Optional: Only available if user uploaded a video
}

export function SopDisplay({ data, videoFile }: SopDisplayProps) {
  const steps = data.steps || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-end mb-6 print:hidden">
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print PDF
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <div className="text-6xl mb-4">{data.emoji_icon}</div>
          <CardTitle className="text-3xl font-bold">{data.title}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> {data.estimated_time_minutes}m</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="border-l-2 border-slate-200 pl-6 relative pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-slate-600 mt-1 mb-2">{step.instruction}</p>

              {/* RENDER SCREENSHOT IF TIMESTAMP & FILE EXIST */}
              {step.timestamp_seconds !== undefined && videoFile && (
                <VideoScreenshotter 
                  videoFile={videoFile} 
                  timestamp={step.timestamp_seconds} 
                  altText={step.title} 
                />
              )}

              {step.warning && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{step.warning}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

