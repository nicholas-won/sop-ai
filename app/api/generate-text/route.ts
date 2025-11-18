import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { textInput } = await req.json();
    
    // Use the latest 2.5 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Technical Writer. Convert this messy text into a structured SOP.

      INPUT: "${textInput}"
      
      REQUIRED JSON STRUCTURE:

      {
        "title": "String",
        "emoji_icon": "String",
        "summary": "String",
        "estimated_time_minutes": Number,
        "tools_required": ["String"],
        "steps": [{ "title": "String", "instruction": "String", "warning": "String (Optional)" }],
        "troubleshooting_tips": ["String"]
      }
    `;

    const result = await model.generateContent(prompt);
    const sopData = JSON.parse(result.response.text());
    return NextResponse.json(sopData);

  } catch (error) {
    return NextResponse.json({ error: 'Generation Failed' }, { status: 500 });
  }
}

