# SOP.ai

Generate structured Standard Operating Procedures from text or video using Google Gemini 2.5 Flash.

## Features

- **Text-to-SOP**: Convert messy text into structured SOPs
- **Video-to-SOP**: Upload screen recordings and automatically generate SOPs with screenshots
- **Visual Grounding**: AI identifies exact timestamps in videos for step-by-step screenshots
- **Print to PDF**: Export your SOPs as PDFs

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Google Gemini 2.5 Flash
- react-dropzone

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```
GOOGLE_API_KEY=your_google_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Text Input
Paste your process description in the text area and click "Generate SOP". The AI will structure it into a professional SOP.

### Video Input
Upload a screen recording showing your process. Gemini 2.5 Flash will:
- Watch the entire video
- Extract each step with timestamps
- Generate screenshots at key moments
- Create a comprehensive SOP with visual references

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate-text/    # Text-to-SOP API
│   │   └── generate-video/   # Video-to-SOP API
│   ├── layout.tsx
│   └── page.tsx              # Main page
├── components/
│   ├── SopDisplay.tsx        # SOP display component
│   ├── VideoScreenshotter.tsx # Video frame extraction
│   └── ui/                   # Shadcn UI components
├── types/
│   └── sop.ts                # TypeScript interfaces
└── lib/
    └── utils.ts              # Utility functions
```

## Environment Variables

- `GOOGLE_API_KEY`: Your Google Generative AI API key (required)

## License

ISC

