-- ============================================
-- SIMPLE REVIEWS SETUP - Run this in Supabase SQL Editor
-- ============================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create review replies table
CREATE TABLE IF NOT EXISTS review_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create review likes table
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- 4. Create reply likes table
CREATE TABLE IF NOT EXISTS reply_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_id UUID NOT NULL REFERENCES review_replies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

-- 5. Create review reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add rating columns to places table
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);

-- 8. Enable RLS (Row Level Security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (allow all for now)
DROP POLICY IF EXISTS "Allow all operations on reviews" ON reviews;
CREATE POLICY "Allow all operations on reviews" ON reviews FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on review_replies" ON review_replies;
CREATE POLICY "Allow all operations on review_replies" ON review_replies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on review_likes" ON review_likes;
CREATE POLICY "Allow all operations on review_likes" ON review_likes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on reply_likes" ON reply_likes;
CREATE POLICY "Allow all operations on reply_likes" ON reply_likes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on review_reports" ON review_reports;
CREATE POLICY "Allow all operations on review_reports" ON review_reports FOR ALL USING (true);

-- 10. Success message
SELECT 'Reviews system setup complete! ✅' as status;