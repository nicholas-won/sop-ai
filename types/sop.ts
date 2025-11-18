export interface SopStep {
  title: string;
  instruction: string;
  warning?: string;
  timestamp_seconds?: number; // Critical for screenshots
  visual_proof?: string; // Describe specific text or UI element visible at this timestamp to prove correct frame
}

export interface SopSchema {
  title: string;
  emoji_icon: string;
  summary: string;
  estimated_time_minutes: number;
  tools_required: string[];
  steps: SopStep[];
  troubleshooting_tips: string[];
}

