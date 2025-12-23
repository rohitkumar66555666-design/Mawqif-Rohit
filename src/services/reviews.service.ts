import { supabase } from './supabase';
import { Review, ReviewReply } from '../types';

export class ReviewsService {
  /**
   * Test database connection and table existence
   */
  static async testConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test 1: Basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('places')
        .select('id')
        .limit(1);

      if (connectionError) {
        console.error('❌ BASIC CONNECTION FAILED:', connectionError.message);
        throw new Error(`Connection failed: ${connectionError.message}`);
      }
      console.log('✅ Basic Supabase connection works');

      // Test 2: Reviews table exists
      const { data: reviewsTest, error: reviewsError } = await supabase
        .from('reviews')
        .select('id')
        .limit(1);

      if (reviewsError) {
        console.error('❌ REVIEWS TABLE ERROR:', reviewsError.message);
        if (reviewsError.message.includes('does not exist')) {
          throw new Error('REVIEWS TABLE MISSING - You need to run the SQL setup file!');
        }
        throw new Error(`Reviews table error: ${reviewsError.message}`);
      }
      console.log('✅ Reviews table exists and accessible');

      // Test 3: Check if places exist
      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('id, title')
        .limit(5);

      if (placesError) {
        console.error('❌ PLACES TABLE ERROR:', placesError.message);
        throw new Error(`Places table error: ${placesError.message}`);
      }

      if (!placesData || placesData.length === 0) {
        console.warn('⚠️ NO PLACES FOUND - You need to add some places first!');
        throw new Error('NO PLACES IN DATABASE - Add some places first before reviewing');
      }

      console.log(`✅ Found ${placesData.length} places in database`);
      console.log('✅ Database setup is complete and working!');
      
    } catch (error) {
      console.error('❌ Connection test error:', error);
      throw error;
    }
  }
  /**
   * Get all reviews for a specific place
   */
  static async getReviewsForPlace(placeId: string, sortBy: 'newest' | 'oldest' | 'most_liked' = 'newest'): Promise<Review[]> {
    try {
      console.log('🔄 Fetching reviews for place:', placeId);
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          replies:review_replies(
            *
          )
        `)
        .eq('place_id', placeId);

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching reviews:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} reviews for place ${placeId}`);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getReviewsForPlace:', error);
      throw error;
    }
  }

  /**
   * Add a new review
   */
  static async addReview(
    placeId: string,
    userId: string,
    userName: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      console.log('🔄 ReviewsService.addReview called with:', { placeId, userId, userName, rating, comment });
      
      const reviewData = {
        place_id: placeId,
        // Let Supabase auto-generate user_id with UUID default
        user_name: userName,
        rating,
        comment: comment, // Use 'comment' column instead of 'review_text'
        likes_count: 0,
        dislikes_count: 0,
        replies_count: 0,
        is_owner: false,
        // Let Supabase handle created_at with default timestamp
      };

      console.log('📝 Inserting review data:', reviewData);

      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        
        // Provide specific error messages for common issues
        if (error.message.includes('uuid')) {
          throw new Error('Database UUID configuration issue. Please run the COMPLETE_UUID_FIX.sql file in your Supabase dashboard.');
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          throw new Error('Database schema issue. Please run the COMPLETE_UUID_FIX.sql file to add missing columns.');
        } else if (error.message.includes('null value') && error.message.includes('comment')) {
          throw new Error('Database column mismatch. Please run the COMPLETE_UUID_FIX.sql file to fix column issues.');
        } else {
          throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
        }
      }

      console.log('✅ Review added successfully:', data);
      
      // Update place rating and review count
      await this.updatePlaceRating(placeId);
      
      return data;
    } catch (error) {
      console.error('❌ Error in addReview:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add review');
    }
  }

  /**
   * Add a reply to a review
   */
  static async addReply(
    reviewId: string,
    userId: string,
    userName: string,
    comment: string,
    isOwner: boolean = false
  ): Promise<ReviewReply> {
    try {
      const replyData = {
        review_id: reviewId,
        user_id: userId,
        user_name: userName,
        comment,
        likes_count: 0,
        dislikes_count: 0,
        is_owner: isOwner,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('review_replies')
        .insert([replyData])
        .select()
        .single();

      if (error) {
        console.error('Error adding reply:', error);
        throw error;
      }

      // Update replies count in the parent review
      await this.updateReviewRepliesCount(reviewId);

      return data;
    } catch (error) {
      console.error('Error in addReply:', error);
      throw error;
    }
  }

  /**
   * Like a review
   */
  static async likeReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Check if user already liked this review
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .eq('is_like', true)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .eq('is_like', true);
      } else {
        // Remove any existing dislike first
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .eq('is_like', false);

        // Add like
        await supabase
          .from('review_likes')
          .insert([{
            review_id: reviewId,
            user_id: userId,
            is_like: true,
          }]);
      }

      // Update likes count in review
      await this.updateReviewLikesCount(reviewId);
    } catch (error) {
      console.error('Error in likeReview:', error);
      throw error;
    }
  }

  /**
   * Dislike a review
   */
  static async dislikeReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Check if user already disliked this review
      const { data: existingDislike } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .eq('is_like', false)
        .single();

      if (existingDislike) {
        // Remove dislike
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .eq('is_like', false);
      } else {
        // Remove any existing like first
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .eq('is_like', true);

        // Add dislike
        await supabase
          .from('review_likes')
          .insert([{
            review_id: reviewId,
            user_id: userId,
            is_like: false,
          }]);
      }

      // Update dislikes count in review
      await this.updateReviewLikesCount(reviewId);
    } catch (error) {
      console.error('Error in dislikeReview:', error);
      throw error;
    }
  }

  /**
   * Like a reply
   */
  static async likeReply(replyId: string, userId: string): Promise<void> {
    try {
      // Check if user already liked this reply
      const { data: existingLike } = await supabase
        .from('reply_likes')
        .select('*')
        .eq('reply_id', replyId)
        .eq('user_id', userId)
        .eq('is_like', true)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', userId)
          .eq('is_like', true);
      } else {
        // Remove any existing dislike first
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', userId)
          .eq('is_like', false);

        // Add like
        await supabase
          .from('reply_likes')
          .insert([{
            reply_id: replyId,
            user_id: userId,
            is_like: true,
          }]);
      }

      // Update likes count in reply
      await this.updateReplyLikesCount(replyId);
    } catch (error) {
      console.error('Error in likeReply:', error);
      throw error;
    }
  }

  /**
   * Dislike a reply
   */
  static async dislikeReply(replyId: string, userId: string): Promise<void> {
    try {
      // Check if user already disliked this reply
      const { data: existingDislike } = await supabase
        .from('reply_likes')
        .select('*')
        .eq('reply_id', replyId)
        .eq('user_id', userId)
        .eq('is_like', false)
        .single();

      if (existingDislike) {
        // Remove dislike
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', userId)
          .eq('is_like', false);
      } else {
        // Remove any existing like first
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', userId)
          .eq('is_like', true);

        // Add dislike
        await supabase
          .from('reply_likes')
          .insert([{
            reply_id: replyId,
            user_id: userId,
            is_like: false,
          }]);
      }

      // Update dislikes count in reply
      await this.updateReplyLikesCount(replyId);
    } catch (error) {
      console.error('Error in dislikeReply:', error);
      throw error;
    }
  }

  /**
   * Report a review
   */
  static async reportReview(reviewId: string, userId: string, reason: string): Promise<void> {
    try {
      await supabase
        .from('review_reports')
        .insert([{
          review_id: reviewId,
          user_id: userId,
          reason,
          created_at: new Date().toISOString(),
        }]);
    } catch (error) {
      console.error('Error in reportReview:', error);
      throw error;
    }
  }

  /**
   * Delete a review (for owners/admins)
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Get the place_id before deleting the review
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('place_id')
        .eq('id', reviewId)
        .single();

      // In a real app, you'd check if the user has permission to delete
      await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      // Update place rating after deletion
      if (reviewData?.place_id) {
        await this.updatePlaceRating(reviewData.place_id);
      }
    } catch (error) {
      console.error('Error in deleteReview:', error);
      throw error;
    }
  }

  /**
   * Update likes/dislikes count for a review
   */
  private static async updateReviewLikesCount(reviewId: string): Promise<void> {
    try {
      // Count likes
      const { count: likesCount, error: likesError } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId)
        .eq('is_like', true);

      if (likesError) {
        console.error('Error counting likes:', likesError);
        return;
      }

      // Count dislikes
      const { count: dislikesCount, error: dislikesError } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId)
        .eq('is_like', false);

      if (dislikesError) {
        console.error('Error counting dislikes:', dislikesError);
        return;
      }

      // Update review
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          likes_count: likesCount || 0,
          dislikes_count: dislikesCount || 0,
        })
        .eq('id', reviewId);

      if (updateError) {
        console.error('Error updating review counts:', updateError);
      }
    } catch (error) {
      console.error('Error updating review likes count:', error);
    }
  }

  /**
   * Update likes/dislikes count for a reply
   */
  private static async updateReplyLikesCount(replyId: string): Promise<void> {
    try {
      // Count likes
      const { count: likesCount, error: likesError } = await supabase
        .from('reply_likes')
        .select('*', { count: 'exact', head: true })
        .eq('reply_id', replyId)
        .eq('is_like', true);

      if (likesError) {
        console.error('Error counting reply likes:', likesError);
        return;
      }

      // Count dislikes
      const { count: dislikesCount, error: dislikesError } = await supabase
        .from('reply_likes')
        .select('*', { count: 'exact', head: true })
        .eq('reply_id', replyId)
        .eq('is_like', false);

      if (dislikesError) {
        console.error('Error counting reply dislikes:', dislikesError);
        return;
      }

      // Update reply
      const { error: updateError } = await supabase
        .from('review_replies')
        .update({
          likes_count: likesCount || 0,
          dislikes_count: dislikesCount || 0,
        })
        .eq('id', replyId);

      if (updateError) {
        console.error('Error updating reply counts:', updateError);
      }
    } catch (error) {
      console.error('Error updating reply likes count:', error);
    }
  }

  /**
   * Update replies count for a review
   */
  private static async updateReviewRepliesCount(reviewId: string): Promise<void> {
    try {
      const { count: repliesCount, error: countError } = await supabase
        .from('review_replies')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      if (countError) {
        console.error('Error counting replies:', countError);
        return;
      }

      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          replies_count: repliesCount || 0,
        })
        .eq('id', reviewId);

      if (updateError) {
        console.error('Error updating replies count:', updateError);
      }
    } catch (error) {
      console.error('Error updating review replies count:', error);
    }
  }

  /**
   * Get user's like/dislike status for reviews
   */
  static async getUserReviewInteractions(userId: string, reviewIds: string[]): Promise<Record<string, { liked: boolean; disliked: boolean }>> {
    try {
      const { data } = await supabase
        .from('review_likes')
        .select('review_id, is_like')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      const interactions: Record<string, { liked: boolean; disliked: boolean }> = {};
      
      reviewIds.forEach(id => {
        interactions[id] = { liked: false, disliked: false };
      });

      data?.forEach(interaction => {
        if (interaction.is_like) {
          interactions[interaction.review_id].liked = true;
        } else {
          interactions[interaction.review_id].disliked = true;
        }
      });

      return interactions;
    } catch (error) {
      console.error('Error getting user review interactions:', error);
      return {};
    }
  }

  /**
   * Update place rating and review count based on all reviews
   */
  private static async updatePlaceRating(placeId: string): Promise<void> {
    try {
      console.log('🔄 Updating place rating for:', placeId);
      
      // Get all reviews for this place
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('place_id', placeId);

      if (reviewsError) {
        console.error('❌ Error fetching reviews for rating update:', reviewsError);
        return;
      }

      const reviewCount = reviews?.length || 0;
      let avgRating = 0;

      if (reviewCount > 0) {
        const totalRating = reviews!.reduce((sum, review) => sum + review.rating, 0);
        avgRating = totalRating / reviewCount;
      }

      console.log(`📊 Place ${placeId}: ${reviewCount} reviews, avg rating: ${avgRating.toFixed(2)}`);

      // Update the place with new rating and count
      const { error: updateError } = await supabase
        .from('places')
        .update({
          avg_rating: avgRating,
          review_count: reviewCount,
        })
        .eq('id', placeId);

      if (updateError) {
        console.error('❌ Error updating place rating:', updateError);
      } else {
        console.log('✅ Place rating updated successfully');
      }
    } catch (error) {
      console.error('❌ Error in updatePlaceRating:', error);
    }
  }
}