"use client";

import { useState } from "react";
import { SopSchema, SopStep } from "@/types/sop";
import { VideoScreenshotter } from "./VideoScreenshotter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, AlertTriangle, Clock, Pencil, Trash2, Plus, ChevronUp, ChevronDown, Save, Copy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface SopDisplayProps {
  data: SopSchema;
  videoFile?: File; // Optional: Only available if user uploaded a video
  sopId?: string; // Optional: ID for saving edits to Supabase
}

export function SopDisplay({ data, videoFile, sopId }: SopDisplayProps) {
  // State management
  const [sopData, setSopData] = useState<SopSchema>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update step field
  const updateStep = (index: number, field: keyof SopStep, value: string | number | undefined) => {
    const newSteps = [...sopData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSopData({ ...sopData, steps: newSteps });
  };

  // Move step up or down
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...sopData.steps];
    
    // If moving up and index is 0, return
    if (direction === 'up' && index === 0) return;
    
    // If moving down and index is last, return
    if (direction === 'down' && index === steps.length - 1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
    
    // Update state
    setSopData({ ...sopData, steps });
  };

  // Delete step
  const deleteStep = (index: number) => {
    const newSteps = sopData.steps.filter((_, i) => i !== index);
    setSopData({ ...sopData, steps: newSteps });
  };

  // Add new step
  const addStep = () => {
    const newStep: SopStep = {
      title: "New Step",
      instruction: "Describe the action...",
      warning: "",
      timestamp_seconds: videoFile ? 0 : undefined,
    };
    setSopData({ ...sopData, steps: [...sopData.steps, newStep] });
    
    // Scroll to bottom (optional)
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Update main fields
  const updateField = (field: keyof Omit<SopSchema, 'steps'>, value: string | number) => {
    setSopData({ ...sopData, [field]: value });
  };

  // Save changes to Supabase
  const handleSave = async () => {
    if (!sopId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sops')
        .update(sopData)
        .eq('id', sopId);

      if (error) {
        console.error('Error saving SOP:', error);
        alert('Failed to save changes. Please try again.');
        return;
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving SOP:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Markdown from SOP data
  const generateMarkdown = (data: SopSchema): string => {
    let markdown = `# ${data.title}\n\n`;
    markdown += `> ${data.summary}\n\n`;
    markdown += `## Steps\n\n`;
    
    data.steps.forEach((step, index) => {
      markdown += `${index + 1}. **${step.title}**: ${step.instruction}`;
      if (step.warning) {
        markdown += `\n   ⚠️ **Warning**: ${step.warning}`;
      }
      markdown += `\n\n`;
    });

    return markdown;
  };

  // Copy markdown to clipboard
  const handleCopyMarkdown = async () => {
    try {
      const markdown = generateMarkdown(sopData);
      await navigator.clipboard.writeText(markdown);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        {sopId && isEditing && (
          <Button 
            onClick={handleSave} 
            variant="default"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" /> 
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
        <Button 
          onClick={() => setIsEditing(!isEditing)} 
          variant={isEditing ? "outline" : "outline"}
        >
          <Pencil className="mr-2 h-4 w-4" /> 
          {isEditing ? "Done Editing" : "Edit Mode"}
        </Button>
        <Button onClick={handleCopyMarkdown} variant="outline">
          <Copy className="mr-2 h-4 w-4" /> Copy Markdown
        </Button>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print PDF
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <div className="text-6xl mb-4">{sopData.emoji_icon}</div>
          
          {isEditing ? (
            <Input
              value={sopData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="text-3xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            />
          ) : (
            <CardTitle className="text-3xl font-bold">{sopData.title}</CardTitle>
          )}
          
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1"/> {sopData.estimated_time_minutes}m
            </Badge>
          </div>

          {isEditing && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Summary
              </label>
              <Textarea
                value={sopData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                className="min-h-[100px] border-slate-200"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {sopData.steps.map((step, idx) => (
            <div key={idx} className="border-l-2 border-slate-200 pl-6 relative pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </div>

              {/* Step Toolbar (Edit Mode) */}
              {isEditing && (
                <div className="absolute -right-2 top-0 print:hidden flex gap-1 bg-white/90 backdrop-blur rounded p-1 shadow-sm">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, 'up')}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === sopData.steps.length - 1}
                    onClick={() => moveStep(idx, 'down')}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteStep(idx)}
                    title="Delete step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step Title */}
              {isEditing ? (
                <div className="mb-2">
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(idx, 'title', e.target.value)}
                    className="text-lg font-semibold border-slate-200"
                    placeholder="Step title"
                  />
                </div>
              ) : (
                <h3 className="text-lg font-semibold">{step.title}</h3>
              )}

              {/* Step Instruction */}
              {isEditing ? (
                <div className="mb-2">
                  <Textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                    className="min-h-[80px] border-slate-200"
                    placeholder="Step instruction"
                  />
                </div>
              ) : (
                <p className="text-slate-600 mt-1 mb-2">{step.instruction}</p>
              )}

              {/* Timestamp Input (Edit Mode) */}
              {isEditing && videoFile && (
                <div className="mb-3">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Screenshot Time (sec)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={step.timestamp_seconds ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      updateStep(idx, 'timestamp_seconds', value);
                    }}
                    className="w-32 border-slate-200"
                    placeholder="0.0"
                  />
                </div>
              )}

              {/* Warning Input (Edit Mode) */}
              {isEditing && (
                <div className="mb-3">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Warning (Optional - leave empty to remove)
                  </label>
                  <Input
                    value={step.warning || ''}
                    onChange={(e) => updateStep(idx, 'warning', e.target.value || undefined)}
                    className="border-slate-200"
                    placeholder="Warning message (optional)"
                  />
                </div>
              )}

              {/* RENDER SCREENSHOT IF TIMESTAMP & FILE EXIST */}
              {step.timestamp_seconds !== undefined && videoFile && (
                <VideoScreenshotter 
                  videoFile={videoFile} 
                  timestamp={step.timestamp_seconds} 
                  altText={step.title} 
                />
              )}

              {/* Warning Display (Read-only mode) */}
              {!isEditing && step.warning && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{step.warning}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}

          {/* Add Step Button (Edit Mode) */}
          {isEditing && (
            <div className="pt-4 print:hidden">
              <Button
                onClick={addStep}
                variant="outline"
                className="w-full border-dashed border-2 h-12 text-base"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
