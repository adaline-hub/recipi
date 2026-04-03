-- Create recipes table for real-time collaboration
-- This migration sets up the database schema for Recipi

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  notes TEXT,
  photo TEXT,
  language TEXT DEFAULT 'en',
  translations JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for the recipes table
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access to all users (no authentication required)
CREATE POLICY "Allow read access" ON recipes
  FOR SELECT USING (true);

-- RLS Policy: Allow insert access to all users
CREATE POLICY "Allow insert access" ON recipes
  FOR INSERT WITH CHECK (true);

-- RLS Policy: Allow update access to all users
CREATE POLICY "Allow update access" ON recipes
  FOR UPDATE USING (true);

-- RLS Policy: Allow delete access to all users
CREATE POLICY "Allow delete access" ON recipes
  FOR DELETE USING (true);

-- Enable real-time subscriptions for the recipes table
ALTER PUBLICATION supabase_realtime ADD TABLE recipes;

-- Create indexes for better query performance
CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_updated_at ON recipes(updated_at DESC);
CREATE INDEX idx_recipes_language ON recipes(language);

-- Add helpful comments
COMMENT ON TABLE recipes IS 'Stores recipe data with multi-language support and real-time sync capability';
COMMENT ON COLUMN recipes.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN recipes.title IS 'Recipe name/title';
COMMENT ON COLUMN recipes.ingredients IS 'JSON array of ingredients: ["ingredient1", "ingredient2"]';
COMMENT ON COLUMN recipes.instructions IS 'Step-by-step cooking instructions';
COMMENT ON COLUMN recipes.notes IS 'Tips, substitutions, family memories';
COMMENT ON COLUMN recipes.photo IS 'Base64-encoded image data';
COMMENT ON COLUMN recipes.language IS 'Original language code (en, fr, ja, zh-CN)';
COMMENT ON COLUMN recipes.translations IS 'JSON object with translations: {"en": {...}, "fr": {...}}';
COMMENT ON COLUMN recipes.created_by IS 'Creator name (Little B, Little Pan, etc)';
COMMENT ON COLUMN recipes.created_at IS 'Timestamp when recipe was created';
COMMENT ON COLUMN recipes.updated_at IS 'Timestamp when recipe was last updated';
