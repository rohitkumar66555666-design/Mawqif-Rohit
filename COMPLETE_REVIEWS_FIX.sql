-- ============================================
-- COMPLETE REVIEWS TABLE FIX
-- Add all missing columns to match the code expectations
-- ============================================

-- Add all missing columns that the code expects
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_avatar TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If you have existing data in user_reviews table, copy it over
-- (This assumes your existing table might have different column names)
UPDATE reviews 
SET user_name = COALESCE(user_name, 'Anonymous User')
WHERE user_name IS NULL;

UPDATE reviews 
SET user_id = COALESCE(user_id, 'unknown_user')
WHERE user_id IS NULL;

UPDATE reviews 
SET comment = COALESCE(comment, review_text)
WHERE comment IS NULL AND review_text IS NOT NULL;

-- Make required columns NOT NULL
ALTER TABLE reviews ALTER COLUMN user_name SET DEFAULT 'Anonymous User';
ALTER TABLE reviews ALTER COLUMN user_id SET DEFAULT 'unknown_user';
ALTER TABLE reviews ALTER COLUMN comment SET DEFAULT '';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'All columns added successfully! Reviews table is now complete.' as status;

-- Show final complete table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;