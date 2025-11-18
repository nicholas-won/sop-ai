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
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    console.log(`Processing video: ${file.name}, size: ${file.size}, type: ${file.type}`);

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


      INSTRUCTIONS:
      1. Identify the specific action.
      2. Scan the video to find the EXACT moment the screen changes (e.g., a menu opens, a page loads).
      3. Verify you are looking at the right frame by reading text from the screen (e.g., "I see the 'Submit' button").
      4. Only THEN record the timestamp.

      For every single step, you must perform a "Visual Check" to ensure you have the right frame.
      Do not guess timestamps based on speech pacing. Look at the video.

      If the video is long, double-check the timestamps for the last 3 steps. Ensure they match the visual end-state of the video, not just the end of the audio.

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
            "timestamp_seconds": Number,
            "visual_proof": "String (Describe specific text or UI element visible at this timestamp to prove you are looking at the right frame)"
          }
        ],
        "troubleshooting_tips": ["String"]
      }
    `;

    const result = await model.generateContent([
      { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const sopData = JSON.parse(responseText);
    
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
    console.error('Video Analysis Error:', error);
    
    // Handle specific API errors
    let errorMessage = 'Video Analysis Failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      const errorStr = error.message || String(error);
      
      // Check for API overload/rate limit errors
      if (errorStr.includes('503') || errorStr.includes('overloaded') || errorStr.includes('Service Unavailable')) {
        errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
        statusCode = 503;
      } else if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('quota')) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (errorStr.includes('404') || errorStr.includes('not found')) {
        errorMessage = 'Model not found. Please check your API configuration.';
        statusCode = 404;
      } else if (errorStr.includes('401') || errorStr.includes('unauthorized')) {
        errorMessage = 'Invalid API key. Please check your GOOGLE_API_KEY.';
        statusCode = 401;
      } else {
        errorMessage = error.message || 'Video Analysis Failed';
      }
      
      console.error('Error details:', error.stack || errorStr);
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: statusCode });
  }
}

