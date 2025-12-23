-- ============================================
-- ADD MISSING COLUMNS TO PLACES TABLE
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, let's check what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- ============================================
-- ADD MISSING COLUMNS
-- ============================================

-- Add contact_phone column
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add whatsapp_number column
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add address column (if missing)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add is_open column (for open/closed status)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Add opening_hours column (JSON for flexible hours)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Add photos column (array for multiple images)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Add avg_rating column (for calculated ratings)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0.0;

-- Add review_count column (for review counts)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add owner_id column (for place ownership)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN places.contact_phone IS 'Phone number for calling the place';
COMMENT ON COLUMN places.whatsapp_number IS 'WhatsApp number for messaging';
COMMENT ON COLUMN places.address IS 'Full street address of the place';
COMMENT ON COLUMN places.is_open IS 'Whether the place is currently open';
COMMENT ON COLUMN places.opening_hours IS 'JSON object with opening hours for each day';
COMMENT ON COLUMN places.photos IS 'Array of photo URLs for the place';
COMMENT ON COLUMN places.avg_rating IS 'Average rating from reviews (0.0 to 5.0)';
COMMENT ON COLUMN places.review_count IS 'Total number of reviews';
COMMENT ON COLUMN places.owner_id IS 'ID of the user who owns/manages this place';

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for searching by phone numbers
CREATE INDEX IF NOT EXISTS idx_places_contact_phone ON places(contact_phone);
CREATE INDEX IF NOT EXISTS idx_places_whatsapp_number ON places(whatsapp_number);

-- Index for searching by address
CREATE INDEX IF NOT EXISTS idx_places_address ON places USING gin(to_tsvector('english', address));

-- Index for filtering by open status
CREATE INDEX IF NOT EXISTS idx_places_is_open ON places(is_open);

-- Index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_places_avg_rating ON places(avg_rating DESC);

-- Index for owner queries
CREATE INDEX IF NOT EXISTS idx_places_owner_id ON places(owner_id);

-- ============================================
-- UPDATE EXISTING RECORDS (OPTIONAL)
-- ============================================

-- Set default values for existing records
UPDATE places 
SET 
  is_open = true,
  avg_rating = 0.0,
  review_count = 0
WHERE is_open IS NULL OR avg_rating IS NULL OR review_count IS NULL;

-- ============================================
-- VERIFY THE CHANGES
-- ============================================

-- Check all columns now exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- Expected columns:
-- id, title, type, latitude, longitude, city, capacity, amenities, photo, created_at
-- contact_phone, whatsapp_number, address, is_open, opening_hours, photos, avg_rating, review_count, owner_id

-- ============================================
-- SAMPLE DATA INSERT (FOR TESTING)
-- ============================================

-- Test inserting a place with all new columns
INSERT INTO places (
  title,
  type,
  latitude,
  longitude,
  city,
  address,
  contact_phone,
  whatsapp_number,
  is_open,
  opening_hours,
  amenities,
  capacity
) VALUES (
  'Test Masjid with Contact Info',
  'masjid',
  19.0760,
  72.8777,
  'Mumbai',
  '123 Test Street, Andheri West, Mumbai 400058',
  '+91 9876543210',
  '+91 9876543210',
  true,
  '{
    "monday": "5:00 AM - 10:00 PM",
    "tuesday": "5:00 AM - 10:00 PM",
    "wednesday": "5:00 AM - 10:00 PM",
    "thursday": "5:00 AM - 10:00 PM",
    "friday": "5:00 AM - 10:00 PM",
    "saturday": "5:00 AM - 10:00 PM",
    "sunday": "5:00 AM - 10:00 PM"
  }'::jsonb,
  '{
    "wuzu": true,
    "washroom": true,
    "women_area": true
  }'::jsonb,
  100
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on places table
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view places" ON places;
DROP POLICY IF EXISTS "Anyone can insert places" ON places;
DROP POLICY IF EXISTS "Owners can update their places" ON places;
DROP POLICY IF EXISTS "Owners can delete their places" ON places;

-- Policy: Anyone can read places
CREATE POLICY "Anyone can view places" ON places
  FOR SELECT USING (true);

-- Policy: Anyone can insert places (for now - you can restrict later)
CREATE POLICY "Anyone can insert places" ON places
  FOR INSERT WITH CHECK (true);

-- Policy: Only owners can update their places
CREATE POLICY "Owners can update their places" ON places
  FOR UPDATE USING (auth.uid() = owner_id);

-- Policy: Only owners can delete their places
CREATE POLICY "Owners can delete their places" ON places
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- FUNCTIONS FOR RATING CALCULATIONS
-- ============================================

-- Function to update place rating when reviews change
CREATE OR REPLACE FUNCTION update_place_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update avg_rating and review_count for the place
  UPDATE places 
  SET 
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0.0)
      FROM reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
    )
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update ratings when reviews change
DROP TRIGGER IF EXISTS trigger_update_place_rating ON reviews;
CREATE TRIGGER trigger_update_place_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_place_rating();

-- ============================================
-- VALIDATION FUNCTIONS
-- ============================================

-- Function to validate phone numbers
CREATE OR REPLACE FUNCTION is_valid_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if phone number matches Indian format (+91 followed by 10 digits)
  RETURN phone_number ~ '^\+91[6-9][0-9]{9}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraints for phone validation
ALTER TABLE places 
ADD CONSTRAINT check_contact_phone_format 
CHECK (contact_phone IS NULL OR is_valid_phone(contact_phone));

ALTER TABLE places 
ADD CONSTRAINT check_whatsapp_number_format 
CHECK (whatsapp_number IS NULL OR is_valid_phone(whatsapp_number));

-- Add check constraint for rating range
ALTER TABLE places 
ADD CONSTRAINT check_avg_rating_range 
CHECK (avg_rating >= 0.0 AND avg_rating <= 5.0);

-- Add check constraint for review count
ALTER TABLE places 
ADD CONSTRAINT check_review_count_positive 
CHECK (review_count >= 0);

-- ============================================
-- SAMPLE QUERIES TO TEST NEW COLUMNS
-- ============================================

-- Query places with contact information
SELECT 
  id,
  title,
  address,
  contact_phone,
  whatsapp_number,
  is_open,
  avg_rating,
  review_count
FROM places 
WHERE contact_phone IS NOT NULL 
   OR whatsapp_number IS NOT NULL;

-- Query places by opening hours (example)
SELECT 
  title,
  opening_hours->>'monday' as monday_hours,
  opening_hours->>'friday' as friday_hours
FROM places 
WHERE opening_hours IS NOT NULL;

-- Query places with multiple photos
SELECT 
  title,
  photo as main_photo,
  photos as additional_photos,
  array_length(photos, 1) as photo_count
FROM places 
WHERE photos IS NOT NULL;

-- ============================================
-- CLEANUP (IF NEEDED)
-- ============================================

-- If you need to remove any of these columns later:
-- ALTER TABLE places DROP COLUMN IF EXISTS contact_phone;
-- ALTER TABLE places DROP COLUMN IF EXISTS whatsapp_number;
-- ALTER TABLE places DROP COLUMN IF EXISTS address;
-- ALTER TABLE places DROP COLUMN IF EXISTS is_open;
-- ALTER TABLE places DROP COLUMN IF EXISTS opening_hours;
-- ALTER TABLE places DROP COLUMN IF EXISTS photos;
-- ALTER TABLE places DROP COLUMN IF EXISTS avg_rating;
-- ALTER TABLE places DROP COLUMN IF EXISTS review_count;
-- ALTER TABLE places DROP COLUMN IF EXISTS owner_id;

-- ============================================
-- FINAL VERIFICATION
-- ============================================

-- Show the complete table structure (instead of \d places)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- Count total places
SELECT COUNT(*) as total_places FROM places;

-- Show sample data with new columns
SELECT 
  title,
  city,
  contact_phone,
  whatsapp_number,
  address,
  is_open,
  avg_rating,
  review_count
FROM places 
LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added missing columns to places table!';
  RAISE NOTICE '📱 Added: contact_phone, whatsapp_number';
  RAISE NOTICE '📍 Added: address';
  RAISE NOTICE '🕐 Added: is_open, opening_hours';
  RAISE NOTICE '📸 Added: photos (array)';
  RAISE NOTICE '⭐ Added: avg_rating, review_count';
  RAISE NOTICE '👤 Added: owner_id';
  RAISE NOTICE '🔒 Enabled RLS with appropriate policies';
  RAISE NOTICE '⚡ Created indexes for performance';
  RAISE NOTICE '🔧 Added validation constraints';
  RAISE NOTICE '🎯 Your app should now work with all features!';
END $$;