-- ============================================
-- FINAL REVIEWS TABLE FIX - Corrected Version
-- Add all missing columns with proper data types
-- ============================================

-- Add missing columns with correct data types
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- For user_id, check if it's UUID or VARCHAR
-- If it's UUID, we'll use a proper UUID, if VARCHAR we'll use string
DO $$
BEGIN
    -- Try to add user_id as VARCHAR first
    BEGIN
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, skip
            NULL;
    END;
END $$;

-- Update any NULL values with defaults
UPDATE reviews 
SET user_name = 'Anonymous User'
WHERE user_name IS NULL;

UPDATE reviews 
SET user_id = 'user_' || gen_random_uuid()::text
WHERE user_id IS NULL;

UPDATE reviews 
SET comment = COALESCE(comment, review_text, '')
WHERE comment IS NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Reviews table fixed successfully!' as status;

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;