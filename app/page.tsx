"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { SopDisplay } from "@/components/SopDisplay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Loader2, FileText } from "lucide-react";
import { SopSchema } from "@/types/sop";

export default function Home() {
  const [activeTab, setActiveTab] = useState("text");
  const [input, setInput] = useState(""); // For text mode
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined); // For video mode
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [result, setResult] = useState<SopSchema | null>(null);

  const handleGenerateText = async () => {
    setIsLoading(true);
    setLoadingText("Analyzing text...");
    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        body: JSON.stringify({ textInput: input }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate SOP');
      }

      setResult(await res.json());
    } catch (e) { 
      alert("Error"); 
    } 
    finally { 
      setIsLoading(false); 
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploadedFile(file); // Store file in state for the Screenshotter!
    setIsLoading(true);
    setLoadingText("Watching video & extracting steps...");
    
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to analyze video');
      }

      setResult(await res.json());
    } catch (e) { 
      alert("Error"); 
    } 
    finally { 
      setIsLoading(false); 
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'video/*': [], 'audio/*': [] }, 
    maxFiles: 1 
  });

  if (result) {
    return (
      <div className="py-8 px-4">
        <Button onClick={() => { setResult(null); setUploadedFile(undefined); }} variant="ghost" className="mb-4">← New SOP</Button>
        {/* Pass the file to the display so it can generate screenshots! */}
        <SopDisplay data={result} videoFile={uploadedFile} />
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">SOP.ai</h1>
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="text">Text Input</TabsTrigger>
              <TabsTrigger value="video">Video Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <Textarea 
                placeholder="Paste process steps here..." 
                className="min-h-[200px]"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <Button onClick={handleGenerateText} disabled={isLoading || !input} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <FileText className="mr-2 h-4 w-4"/>}
                Generate SOP
              </Button>
            </TabsContent>

            <TabsContent value="video">
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg h-[200px] flex flex-col items-center justify-center cursor-pointer ${isDragActive ? 'bg-blue-50 border-blue-500' : 'border-slate-200'}`}>
                <input {...getInputProps()} />
                {isLoading ? (
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-2"/>
                    <p className="text-sm text-slate-500">{loadingText}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-2"/>
                    <p className="font-medium">Drop screen recording</p>
                    <p className="text-xs text-slate-400">Gemini 2.5 will watch it</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

