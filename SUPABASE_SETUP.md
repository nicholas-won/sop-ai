# Supabase Database Setup

## Database Schema

Create a table called `sops` in your Supabase database with the following SQL:

```sql
CREATE TABLE sops (
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

-- Enable Row Level Security (optional, adjust based on your needs)
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations" ON sops
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Steps Array Structure

The `steps` column stores JSONB with this structure:

```json
[
  {
    "title": "String",
    "instruction": "String",
    "warning": "String (Optional)",
    "timestamp_seconds": Number,
    "visual_proof": "String (Optional)"
  }
]
```

