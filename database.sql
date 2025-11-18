-- Supabase Database Schema for SOP.ai
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji_icon TEXT NOT NULL,
  summary TEXT NOT NULL,
  estimated_time_minutes INTEGER NOT NULL,
  tools_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  troubleshooting_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust based on your auth needs)
-- For a hackathon/MVP, this allows all users to read/write
CREATE POLICY "Allow all operations" ON sops
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at DESC);

