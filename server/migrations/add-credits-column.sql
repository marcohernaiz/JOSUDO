-- Migration: Add credits column to users table
-- Run this script to add the credits column for existing databases

-- Add credits column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'credits'
    ) THEN
        ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing users to have some default credits (optional)
-- UPDATE users SET credits = 100 WHERE credits IS NULL OR credits = 0;
