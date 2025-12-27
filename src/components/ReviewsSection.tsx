import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { rf, rs } from '../utils/responsive';
import { Review, ReviewReply, ReviewSortOption } from '../types';
import { useReviewsAuth } from '../lib/authHelper';
import { UserProfileService } from '../services/user-profile.service';

interface ReviewsSectionProps {
  placeId: string;
  placeOwnerId?: string;
  currentUserId?: string;
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
  onLikeReview: (reviewId: string) => void;
  onDislikeReview: (reviewId: string) => void;
  onReplyToReview: (reviewId: string, comment: string) => void;
  onReportReview: (reviewId: string, reason: string) => void;
  onDeleteReview?: (reviewId: string) => void;
  onSortChange: (sortOption: ReviewSortOption) => void;
  currentSort: ReviewSortOption;
  navigation?: any; // Add navigation prop for auth
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  placeId,
  placeOwnerId,
  currentUserId,
  reviews,
  onAddReview,
  onLikeReview,
  onDislikeReview,
  onReplyToReview,
  onReportReview,
  onDeleteReview,
  onSortChange,
  currentSort,
  navigation,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { requireReviewAuth } = useReviewsAuth();
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});

  const reviewInputRef = useRef<TextInput>(null);

  // Load user profiles for reviews
  useEffect(() => {
    loadUserProfiles();
  }, [reviews]);

  const loadUserProfiles = async () => {
    const profilePromises = reviews.map(async (review) => {
      if (review.user_id && !userProfiles[review.user_id]) {
        try {
          const profile = await UserProfileService.getProfileForReview(review.user_id);
          return { userId: review.user_id, profile };
        } catch (error) {
          console.error('Error loading profile for review:', error);
          return { userId: review.user_id, profile: null };
        }
      }
      return null;
    });

    const results = await Promise.all(profilePromises);
    const newProfiles = { ...userProfiles };
    
    results.forEach((result) => {
      if (result) {
        newProfiles[result.userId] = result.profile;
      }
    });

    setUserProfiles(newProfiles);
  };

  const handleAddReview = () => {
    if (newReviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }
    
    if (newReviewComment.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write at least 10 characters');
      return;
    }

    onAddReview(newReviewRating, newReviewComment.trim());
    setNewReviewRating(0);
    setNewReviewComment('');
    setShowAddReview(false);
  };

  const handleWriteReviewPress = () => {
    if (!navigation) {
      setShowAddReview(true);
      return;
    }

    // Check authentication first
    const proceedWithWriteReview = () => {
      setShowAddReview(true);
    };

    requireReviewAuth(navigation, 'write', proceedWithWriteReview);
  };

  const handleLikePress = (reviewId: string) => {
    if (!navigation) {
      onLikeReview(reviewId);
      return;
    }

    // Check authentication first
    const proceedWithLike = () => {
      onLikeReview(reviewId);
    };

    requireReviewAuth(navigation, 'like', proceedWithLike);
  };

  const handleDislikePress = (reviewId: string) => {
    if (!navigation) {
      onDislikeReview(reviewId);
      return;
    }

    // Check authentication first
    const proceedWithDislike = () => {
      onDislikeReview(reviewId);
    };

    requireReviewAuth(navigation, 'dislike', proceedWithDislike);
  };

  const handleReplyPress = (reviewId: string, comment: string) => {
    if (!navigation) {
      onReplyToReview(reviewId, comment);
      return;
    }

    // Check authentication first
    const proceedWithReply = () => {
      onReplyToReview(reviewId, comment);
    };

    requireReviewAuth(navigation, 'reply', proceedWithReply);
  };

  const handleReportPress = (reviewId: string, reason: string) => {
    if (!navigation) {
      onReportReview(reviewId, reason);
      return;
    }

    // Check authentication first
    const proceedWithReport = () => {
      onReportReview(reviewId, reason);
    };

    requireReviewAuth(navigation, 'report', proceedWithReport);
  };

  const renderStarRating = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && onRatingChange && onRatingChange(i)}
          disabled={!interactive}
        >
          <MaterialIcons
            name="star"
            size={interactive ? rf(36) : rf(16)}
            color={i <= rating ? "#F59E0B" : "#D1D5DB"}
            style={{ marginRight: rs(2) }}
          />
        </TouchableOpacity>
      );
    }
    
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderSortButtons = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity
        style={[
          styles.sortButton,
          currentSort === 'newest' && styles.activeSortButton
        ]}
        onPress={() => onSortChange('newest')}
      >
        <Text style={[
          styles.sortButtonText,
          currentSort === 'newest' && styles.activeSortButtonText
        ]}>
          {t('newest') || 'Newest'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.sortButton,
          currentSort === 'most_liked' && styles.activeSortButton
        ]}
        onPress={() => onSortChange('most_liked')}
      >
        <Text style={[
          styles.sortButtonText,
          currentSort === 'most_liked' && styles.activeSortButtonText
        ]}>
          {t('mostLiked') || 'Most Liked'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.sortButton,
          currentSort === 'oldest' && styles.activeSortButton
        ]}
        onPress={() => onSortChange('oldest')}
      >
        <Text style={[
          styles.sortButtonText,
          currentSort === 'oldest' && styles.activeSortButtonText
        ]}>
          {t('oldest') || 'Oldest'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReview = ({ item: review }: { item: Review }) => {
    const userProfile = userProfiles[review.user_id];
    const displayName = userProfile?.full_name || review.user_name || 'Anonymous User';
    const profileImageUrl = userProfile?.profile_image_url;
    const userCity = userProfile?.city;
    
    return (
      <View key={review.id} style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {/* User Profile Image */}
            <View style={styles.userImageContainer}>
              {profileImageUrl ? (
                <Image 
                  source={{ uri: profileImageUrl }} 
                  style={styles.userImage}
                />
              ) : (
                <View style={[styles.userImagePlaceholder, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="person" size={rf(20)} color={colors.textInverse} />
                </View>
              )}
            </View>
            
            {/* User Details */}
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {String(displayName)}
              </Text>
              {userCity && (
                <Text style={[styles.userLocation, { color: colors.textSecondary }]}>
                  📍 {String(userCity)}
                </Text>
              )}
            </View>
          </View>
          
          <Text style={[styles.reviewTime, { color: colors.textSecondary }]}>
            {String(new Date(review.created_at).toLocaleDateString())}
          </Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {renderStarRating(review.rating)}
        </View>
        
        <Text style={[styles.reviewText, { color: colors.text }]}>
          {String(review.comment || '')}
        </Text>
        
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePress(review.id)}
          >
            <MaterialIcons 
              name="thumb-up" 
              size={rf(16)} 
              color={review.user_liked ? "#4CAF50" : "#8E8E93"} 
            />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {String(review.likes_count || 0)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDislikePress(review.id)}
          >
            <MaterialIcons 
              name="thumb-down" 
              size={rf(16)} 
              color={review.user_disliked ? "#EF4444" : "#8E8E93"} 
            />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {String(review.dislikes_count || 0)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: rs(20),
    },
    
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: rs(16),
    },
    title: {
      fontSize: rf(18),
      fontWeight: '700',
      color: colors.text,
    },
    writeReviewButton: {
      backgroundColor: '#FF6B35',
      borderRadius: rs(20),
      paddingVertical: rs(8),
      paddingHorizontal: rs(16),
    },
    writeReviewText: {
      fontSize: rf(12),
      fontWeight: '600',
      color: colors.surface,
    },
    
    // Rules Section
    rulesContainer: {
      backgroundColor: 'rgba(139, 69, 19, 0.1)',
      padding: rs(12),
      borderRadius: rs(8),
      borderLeftWidth: rs(4),
      borderLeftColor: '#8B4513',
      marginBottom: rs(16),
    },
    rulesText: {
      fontSize: rf(12),
      color: '#8B4513',
      lineHeight: rf(16),
    },
    
    // Sort Buttons
    sortContainer: {
      flexDirection: 'row',
      marginBottom: rs(20),
    },
    sortButton: {
      paddingHorizontal: rs(16),
      paddingVertical: rs(8),
      borderRadius: rs(20),
      marginRight: rs(8),
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeSortButton: {
      backgroundColor: '#4CAF50',
      borderColor: '#4CAF50',
    },
    sortButtonText: {
      fontSize: rf(14),
      color: colors.text,
      fontWeight: '500',
    },
    activeSortButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },
    
    // Empty State
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: rs(40),
    },
    emptyIcon: {
      marginBottom: rs(16),
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: rf(18),
      fontWeight: '600',
      color: colors.text,
      marginBottom: rs(8),
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: rf(14),
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: rf(20),
    },
    
    // Review Item
    reviewContainer: {
      backgroundColor: colors.surface,
      borderRadius: rs(12),
      padding: rs(16),
      marginBottom: rs(12),
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: rs(8),
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userImageContainer: {
      marginRight: rs(12),
    },
    userImage: {
      width: rs(40),
      height: rs(40),
      borderRadius: rs(20),
    },
    userImagePlaceholder: {
      width: rs(40),
      height: rs(40),
      borderRadius: rs(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: rf(16),
      fontWeight: '600',
      marginBottom: rs(2),
    },
    userLocation: {
      fontSize: rf(12),
    },
    reviewTime: {
      fontSize: rf(12),
    },
    ratingContainer: {
      marginBottom: rs(8),
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewText: {
      fontSize: rf(14),
      color: colors.text,
      lineHeight: rf(20),
      marginBottom: rs(12),
    },
    reviewActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: rs(16),
    },
    actionText: {
      fontSize: rf(12),
      color: colors.textSecondary,
      marginLeft: rs(4),
    },
    
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: rs(20),
      paddingVertical: rs(16),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: rf(18),
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: rs(8),
    },
    modalContent: {
      flex: 1,
      padding: rs(20),
    },
    ratingTitle: {
      fontSize: rf(16),
      fontWeight: '600',
      color: colors.text,
      marginBottom: rs(16),
      textAlign: 'center',
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: rs(8),
      padding: rs(12),
      fontSize: rf(14),
      color: colors.text,
      minHeight: rs(100),
      textAlignVertical: 'top',
      marginTop: rs(20),
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: rs(8),
      paddingVertical: rs(12),
      alignItems: 'center',
      marginTop: rs(20),
    },
    submitButtonText: {
      fontSize: rf(16),
      fontWeight: '600',
      color: colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('userReviews') || 'User Reviews'}</Text>
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={handleWriteReviewPress}
        >
          <Text style={styles.writeReviewText}>{t('writeReview') || 'WRITE REVIEW'}</Text>
        </TouchableOpacity>
      </View>

      {/* Rules */}
      <View style={styles.rulesContainer}>
        <Text style={styles.rulesText}>
          {t('reviewRules') || 'Please read and apply the rules before posting a review.'}
        </Text>
        <Text style={styles.rulesText}>
          {t('reviewTerms') || 'By sharing your review, you agree to all the relevant terms.'}
        </Text>
      </View>

      {/* Sort Buttons */}
      {renderSortButtons()}

      {/* Reviews List or Empty State */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name="chat-bubble-outline" 
            size={rf(64)} 
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>{t('noReviewsYet') || 'No reviews yet'}</Text>
          <Text style={styles.emptyMessage}>
            {t('noReviewsMessage') || 'Be the first to share your experience about this place!'}
          </Text>
        </View>
      ) : (
        <View>
          {reviews.map((review) => renderReview({ item: review }))}
        </View>
      )}

      {/* Add Review Modal */}
      <Modal
        visible={showAddReview}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('writeAReview') || 'Write a Review'}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddReview(false)}
            >
              <MaterialIcons name="close" size={rf(24)} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.ratingTitle}>{t('howWouldYouRate') || 'How would you rate this place?'}</Text>
            {renderStarRating(newReviewRating, true, setNewReviewRating)}
            
            <TextInput
              ref={reviewInputRef}
              style={styles.reviewInput}
              placeholder={t('shareExperiencePlaceholder') || 'Share your experience about this place...'}
              placeholderTextColor={colors.textSecondary}
              value={newReviewComment}
              onChangeText={setNewReviewComment}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddReview}
            >
              <Text style={styles.submitButtonText}>{t('post') || 'Post'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};