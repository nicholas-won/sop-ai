"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Loader2, FileText } from "lucide-react";
import { SopSchema } from "@/types/sop";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("text");
  const [input, setInput] = useState(""); // For text mode
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined); // For video mode
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");

  const saveAndRedirect = async (sopData: SopSchema) => {
    try {
      const { data, error } = await supabase
        .from('sops')
        .insert([sopData])
        .select()
        .single();

      if (error) {
        console.error('Error saving SOP:', error);
        throw new Error('Failed to save SOP');
      }

      // Redirect to the newly created SOP page
      router.push(`/sop/${data.id}`);
    } catch (error) {
      console.error('Error saving SOP:', error);
      alert('Failed to save SOP. Please try again.');
    }
  };

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

      const sopData = await res.json();
      
      // Save to Supabase and redirect
      await saveAndRedirect(sopData);
    } catch (e) { 
      console.error('Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate SOP';
      alert(`Error: ${errorMessage}`);
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
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData.error || `Server error: ${res.status}`;
        
        // Show more helpful messages for specific errors
        if (res.status === 503) {
          throw new Error(errorMsg || 'The AI model is currently busy. Please try again in a few moments.');
        } else if (res.status === 429) {
          throw new Error(errorMsg || 'Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(errorMsg);
        }
      }

      const sopData = await res.json();
      
      // Save to Supabase and redirect
      await saveAndRedirect(sopData);
    } catch (e) { 
      console.error('Video upload error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to analyze video';
      
      // Show user-friendly error message
      if (errorMessage.includes('overloaded') || errorMessage.includes('busy')) {
        alert(`⚠️ AI Service Busy\n\n${errorMessage}\n\nTip: Wait 10-30 seconds and try again.`);
      } else {
        alert(`❌ Error: ${errorMessage}`);
      }
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

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
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
    </div>
  );
}

