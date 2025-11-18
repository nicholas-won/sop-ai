export interface SopStep {
  title: string;
  instruction: string;
  warning?: string;
  timestamp_seconds?: number; // Critical for screenshots
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

