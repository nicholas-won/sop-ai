import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join('/tmp', file.name); 
    await writeFile(tempPath, buffer);

    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: file.type,
      displayName: file.name,
    });

    let fileRecord = await fileManager.getFile(uploadResult.file.name);
    while (fileRecord.state === FileState.PROCESSING) {
      await new Promise(r => setTimeout(r, 1000)); // 2.5 is faster, poll every 1s
      fileRecord = await fileManager.getFile(uploadResult.file.name);
    }

    if (fileRecord.state === FileState.FAILED) throw new Error("Video processing failed");

    // Use Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Technical Writer. Watch this video and create a structured SOP.

      CRITICAL INSTRUCTION:
      For every step, you must identify the EXACT timestamp (in seconds) where the action visually occurs.
      Look for stable frames where the button or menu is clearly visible.

      REQUIRED JSON STRUCTURE:

      {
        "title": "String",
        "emoji_icon": "String",
        "summary": "String",
        "estimated_time_minutes": Number,
        "tools_required": ["String"],
        "steps": [
          { 
            "title": "String", 
            "instruction": "String", 
            "warning": "String (Optional)",
            "timestamp_seconds": Number 
          }
        ],
        "troubleshooting_tips": ["String"]
      }
    `;

    const result = await model.generateContent([
      { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
      { text: prompt },
    ]);

    const sopData = JSON.parse(result.response.text());
    
    // Validate and filter out empty steps
    if (sopData.steps && Array.isArray(sopData.steps)) {
      sopData.steps = sopData.steps.filter((step: any) => 
        step && step.title && step.title.trim() && step.instruction && step.instruction.trim()
      );
    }
    
    // Ensure required fields have defaults
    if (!sopData.tools_required) sopData.tools_required = [];
    if (!sopData.troubleshooting_tips) sopData.troubleshooting_tips = [];
    if (!sopData.steps) sopData.steps = [];
    
    return NextResponse.json(sopData);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Video Analysis Failed' }, { status: 500 });
  }
}

