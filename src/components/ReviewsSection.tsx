import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { rf, rs } from '../utils/responsive';
import { Review, ReviewReply, ReviewSortOption } from '../types';

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
}) => {
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReview, setReportingReview] = useState<string | null>(null);
  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // Optimistic updates state for immediate UI feedback
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { liked: boolean; disliked: boolean; likesCount: number; dislikesCount: number }>>({});
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  const reviewInputRef = useRef<TextInput>(null);

  // Use only real reviews from database - no hardcoded data
  const displayReviews = reviews;

  // Smart optimistic state management - only clear when server data is updated
  React.useEffect(() => {
    // Only clear optimistic state for reviews that now have updated server data
    setOptimisticLikes(prev => {
      const newOptimistic = { ...prev };
      
      // Check each optimistic update against server data
      Object.keys(prev).forEach(reviewId => {
        const review = reviews.find(r => r.id === reviewId);
        const optimisticState = prev[reviewId];
        
        if (review) {
          // If server data matches optimistic state, we can clear it
          const serverMatches = 
            (review.user_liked || false) === optimisticState.liked &&
            (review.user_disliked || false) === optimisticState.disliked &&
            review.likes_count === optimisticState.likesCount &&
            review.dislikes_count === optimisticState.dislikesCount;
            
          if (serverMatches) {
            delete newOptimistic[reviewId];
          }
        }
      });
      
      return newOptimistic;
    });
    
    // Clear processing actions after reviews update
    setProcessingActions(new Set());
  }, [reviews]);

  // Optimistic like handler with immediate UI feedback
  const handleOptimisticLike = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    // Get current state (optimistic or actual)
    const currentState = optimisticLikes[reviewId] || {
      liked: review.user_liked || false,
      disliked: review.user_disliked || false,
      likesCount: review.likes_count,
      dislikesCount: review.dislikes_count,
    };

    // Calculate new state
    const wasLiked = currentState.liked;
    const wasDisliked = currentState.disliked;
    const newLiked = !wasLiked;
    const newDisliked = false; // Remove dislike if liking

    let newLikesCount = currentState.likesCount;
    let newDislikesCount = currentState.dislikesCount;

    // Update counts
    if (newLiked && !wasLiked) {
      newLikesCount += 1;
    } else if (!newLiked && wasLiked) {
      newLikesCount -= 1;
    }

    if (wasDisliked && !newDisliked) {
      newDislikesCount -= 1;
    }

    // Set optimistic state immediately
    setOptimisticLikes(prev => ({
      ...prev,
      [reviewId]: {
        liked: newLiked,
        disliked: newDisliked,
        likesCount: newLikesCount,
        dislikesCount: newDislikesCount,
      }
    }));

    // Add processing state for visual feedback
    setProcessingActions(prev => new Set([...prev, `like-${reviewId}`]));

    // Call the actual API (non-blocking)
    try {
      onLikeReview(reviewId);
      
      // Remove processing state after server data is likely updated
      // The useEffect above will clear optimistic state when server data matches
      setTimeout(() => {
        setProcessingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(`like-${reviewId}`);
          return newSet;
        });
      }, 1000); // Increased timeout to allow server update
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticLikes(prev => {
        const newState = { ...prev };
        delete newState[reviewId];
        return newState;
      });
      
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`like-${reviewId}`);
        return newSet;
      });
      
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  // Optimistic dislike handler with immediate UI feedback
  const handleOptimisticDislike = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    // Get current state (optimistic or actual)
    const currentState = optimisticLikes[reviewId] || {
      liked: review.user_liked || false,
      disliked: review.user_disliked || false,
      likesCount: review.likes_count,
      dislikesCount: review.dislikes_count,
    };

    // Calculate new state
    const wasLiked = currentState.liked;
    const wasDisliked = currentState.disliked;
    const newLiked = false; // Remove like if disliking
    const newDisliked = !wasDisliked;

    let newLikesCount = currentState.likesCount;
    let newDislikesCount = currentState.dislikesCount;

    // Update counts
    if (newDisliked && !wasDisliked) {
      newDislikesCount += 1;
    } else if (!newDisliked && wasDisliked) {
      newDislikesCount -= 1;
    }

    if (wasLiked && !newLiked) {
      newLikesCount -= 1;
    }

    // Set optimistic state immediately
    setOptimisticLikes(prev => ({
      ...prev,
      [reviewId]: {
        liked: newLiked,
        disliked: newDisliked,
        likesCount: newLikesCount,
        dislikesCount: newDislikesCount,
      }
    }));

    // Add processing state for visual feedback
    setProcessingActions(prev => new Set([...prev, `dislike-${reviewId}`]));

    // Call the actual API (non-blocking)
    try {
      onDislikeReview(reviewId);
      
      // Remove processing state after server data is likely updated
      // The useEffect above will clear optimistic state when server data matches
      setTimeout(() => {
        setProcessingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(`dislike-${reviewId}`);
          return newSet;
        });
      }, 1000); // Increased timeout to allow server update
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticLikes(prev => {
        const newState = { ...prev };
        delete newState[reviewId];
        return newState;
      });
      
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`dislike-${reviewId}`);
        return newSet;
      });
      
      Alert.alert('Error', 'Failed to update dislike. Please try again.');
    }
  };

  // Helper function to get current like state (optimistic or actual)
  const getLikeState = (review: Review) => {
    const optimistic = optimisticLikes[review.id];
    if (optimistic) {
      return optimistic;
    }
    return {
      liked: review.user_liked || false,
      disliked: review.user_disliked || false,
      likesCount: review.likes_count,
      dislikesCount: review.dislikes_count,
    };
  };

  const renderStarRating = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && onRatingChange && onRatingChange(i)}
          disabled={!interactive}
          style={interactive ? styles.interactiveStarButton : undefined}
        >
          <MaterialIcons
            name={i <= rating ? "star" : "star-outline"}
            size={interactive ? rf(36) : rf(24)} // Larger stars for interactive rating
            color={i <= rating ? "#F59E0B" : "#D1D5DB"}
            style={interactive ? styles.interactiveStarIcon : styles.starIcon}
          />
        </TouchableOpacity>
      );
    }
    
    return <View style={interactive ? styles.interactiveStarsContainer : styles.starsContainer}>{stars}</View>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const handleAddReview = () => {
    if (newReviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating for your review.');
      return;
    }
    
    if (newReviewComment.trim().length < 10) {
      Alert.alert('Invalid Review', 'Please write at least 10 characters for your review.');
      return;
    }
    
    onAddReview(newReviewRating, newReviewComment.trim());
    setNewReviewComment('');
    setNewReviewRating(0);
    setShowAddReview(false);
  };

  const handleReply = (reviewId: string) => {
    if (replyText.trim().length < 3) {
      Alert.alert('Invalid Reply', 'Please write at least 3 characters for your reply.');
      return;
    }
    
    onReplyToReview(reviewId, replyText.trim());
    setReplyText('');
    setReplyingTo(null);
  };

  const handleReport = () => {
    if (reportingReview && selectedReportReasons.length > 0) {
      const reasons = selectedReportReasons.join(', ');
      onReportReview(reportingReview, reasons);
      setShowReportModal(false);
      setReportingReview(null);
      setSelectedReportReasons([]);
    }
  };

  const toggleReportReason = (reason: string) => {
    setSelectedReportReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  };

  const toggleReplies = (reviewId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReplies(newExpanded);
  };

  const renderSortButtons = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity
        style={[styles.sortButton, currentSort === 'newest' && styles.activeSortButton]}
        onPress={() => onSortChange('newest')}
      >
        <Text style={[styles.sortButtonText, currentSort === 'newest' && styles.activeSortButtonText]}>
          Newest
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.sortButton, currentSort === 'most_liked' && styles.activeSortButton]}
        onPress={() => onSortChange('most_liked')}
      >
        <Text style={[styles.sortButtonText, currentSort === 'most_liked' && styles.activeSortButtonText]}>
          Most Liked
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.sortButton, currentSort === 'oldest' && styles.activeSortButton]}
        onPress={() => onSortChange('oldest')}
      >
        <Text style={[styles.sortButtonText, currentSort === 'oldest' && styles.activeSortButtonText]}>
          Oldest
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReply = (reply: ReviewReply) => (
    <View key={reply.id} style={styles.replyContainer}>
      <View style={styles.replyHeader}>
        <View style={styles.replyUserInfo}>
          <Text style={styles.replyUserName}>
            {reply.user_name}
            {reply.is_owner && (
              <View style={styles.ownerBadge}>
                <MaterialIcons name="verified" size={rf(14)} color={COLORS.primary} />
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            )}
          </Text>
          <Text style={styles.replyTime}>{formatTimeAgo(reply.created_at)}</Text>
        </View>
        
        <View style={styles.replyActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => {/* Handle reply like */}}
          >
            <Ionicons
              name={reply.user_liked ? "thumbs-up" : "thumbs-up-outline"}
              size={rf(16)}
              color={reply.user_liked ? "#4CAF50" : "#8E8E93"}
            />
            <Text style={[styles.likeCount, reply.user_liked && { color: "#4CAF50" }]}>
              {reply.likes_count}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dislikeButton}
            onPress={() => {/* Handle reply dislike */}}
          >
            <Ionicons
              name={reply.user_disliked ? "thumbs-down" : "thumbs-down-outline"}
              size={rf(16)}
              color={reply.user_disliked ? "#EF4444" : "#8E8E93"}
            />
            <Text style={[styles.dislikeCount, reply.user_disliked && { color: "#EF4444" }]}>
              {reply.dislikes_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.replyText}>{reply.comment}</Text>
    </View>
  );

  const renderReview = ({ item: review }: { item: Review }) => (
    <View style={styles.reviewContainer}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {review.user_name}
            {review.is_owner && (
              <View style={styles.ownerBadge}>
                <MaterialIcons name="verified" size={rf(16)} color={COLORS.primary} />
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            )}
          </Text>
          <View style={styles.ratingTime}>
            {renderStarRating(review.rating)}
            <Text style={styles.reviewTime}>{formatTimeAgo(review.created_at)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.reviewText}>{review.comment}</Text>
      
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setReplyingTo(review.id)}
        >
          <Ionicons name="chatbubble-outline" size={rf(20)} color="#8E8E93" />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            getLikeState(review).liked && styles.likedButton,
            processingActions.has(`like-${review.id}`) && styles.processingButton
          ]}
          onPress={() => handleOptimisticLike(review.id)}
          disabled={processingActions.has(`like-${review.id}`)}
        >
          <Ionicons
            name={getLikeState(review).liked ? "thumbs-up" : "thumbs-up-outline"}
            size={rf(20)}
            color={getLikeState(review).liked ? "#4CAF50" : "#8E8E93"}
          />
          <Text style={[
            styles.actionText, 
            getLikeState(review).liked && { color: "#4CAF50", fontWeight: '600' }
          ]}>
            {getLikeState(review).likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            getLikeState(review).disliked && styles.dislikedButton,
            processingActions.has(`dislike-${review.id}`) && styles.processingButton
          ]}
          onPress={() => handleOptimisticDislike(review.id)}
          disabled={processingActions.has(`dislike-${review.id}`)}
        >
          <Ionicons
            name={getLikeState(review).disliked ? "thumbs-down" : "thumbs-down-outline"}
            size={rf(20)}
            color={getLikeState(review).disliked ? "#EF4444" : "#8E8E93"}
          />
          <Text style={[
            styles.actionText, 
            getLikeState(review).disliked && { color: "#EF4444", fontWeight: '600' }
          ]}>
            {getLikeState(review).dislikesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setReportingReview(review.id);
            setShowReportModal(true);
          }}
        >
          <Ionicons name="flag-outline" size={rf(20)} color="#8E8E93" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
      
      {/* Reply Input */}
      {replyingTo === review.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyInputActions}>
            <TouchableOpacity
              style={styles.cancelReplyButton}
              onPress={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              <Text style={styles.cancelReplyText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitReplyButton}
              onPress={() => handleReply(review.id)}
            >
              <Text style={styles.submitReplyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Replies */}
      {review.replies && review.replies.length > 0 && (
        <View style={styles.repliesSection}>
          <TouchableOpacity
            style={styles.viewRepliesButton}
            onPress={() => toggleReplies(review.id)}
          >
            <MaterialIcons
              name={expandedReplies.has(review.id) ? "expand-less" : "expand-more"}
              size={rf(20)}
              color={COLORS.primary}
            />
            <Text style={styles.viewRepliesText}>
              {expandedReplies.has(review.id) ? 'Hide' : 'View'} {review.replies_count} replies
            </Text>
          </TouchableOpacity>
          
          {expandedReplies.has(review.id) && (
            <View style={styles.repliesList}>
              {review.replies.map(renderReply)}
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Reviews</Text>
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => setShowAddReview(true)}
        >
          <Text style={styles.writeReviewText}>WRITE REVIEW</Text>
        </TouchableOpacity>
      </View>
      
      {/* Rules */}
      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>Please read and apply the rules before posting a review.</Text>
        <Text style={styles.rulesSubtitle}>By sharing your review, you agree to all the relevant terms.</Text>
      </View>
      
      {/* Sort Options */}
      {renderSortButtons()}
      
      {/* Reviews List */}
      {displayReviews.length > 0 ? (
        <FlatList
          data={displayReviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Disable scroll since it's inside ScrollView
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={rf(64)} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Be the first to share your experience about this place!
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowAddReview(true)}
          >
            <Text style={styles.emptyStateButtonText}>Write First Review</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Add Review Modal */}
      <Modal
        visible={showAddReview}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowAddReview(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={rf(28)} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <TouchableOpacity onPress={handleAddReview} style={styles.modalSubmitButton}>
              <Text style={styles.submitButton}>Post</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.ratingLabel}>How would you rate this place?</Text>
            <Text style={styles.ratingInstruction}>Tap the stars to select your rating</Text>
            {renderStarRating(newReviewRating, true, setNewReviewRating)}
            
            <Text style={styles.reviewLabel}>Share Your Experience</Text>
            <Text style={styles.reviewInstruction}>Tell others about your visit</Text>
            <TextInput
              ref={reviewInputRef}
              style={styles.reviewInput}
              placeholder="Share your experience about this place..."
              placeholderTextColor={COLORS.textSecondary}
              value={newReviewComment}
              onChangeText={setNewReviewComment}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {newReviewComment.length}/1000 characters
            </Text>
            
            {/* Helpful Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips for a great review:</Text>
              <Text style={styles.tipText}>• Be specific about your experience</Text>
              <Text style={styles.tipText}>• Mention what you liked or didn't like</Text>
              <Text style={styles.tipText}>• Help others make informed decisions</Text>
              <Text style={styles.tipText}>• Keep it respectful and honest</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Report Modal - Full Screen */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.reportModalContainer}>
          {/* Header */}
          <View style={styles.reportModalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowReportModal(false);
                setReportingReview(null);
                setSelectedReportReasons([]);
              }}
            >
              <Ionicons name="close" size={rf(28)} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.reportModalTitle}>Report Review</Text>
            <TouchableOpacity
              style={[
                styles.submitHeaderButton,
                selectedReportReasons.length === 0 && styles.disabledSubmitHeaderButton
              ]}
              onPress={handleReport}
              disabled={selectedReportReasons.length === 0}
            >
              <Text style={[
                styles.submitHeaderButtonText,
                selectedReportReasons.length === 0 && styles.disabledSubmitHeaderButtonText
              ]}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.reportModalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.reportModalSubtitle}>
              Help us understand what's happening with this review. Select all reasons that apply:
            </Text>
            
            <View style={styles.reportOptionsContainer}>
              {[
                { key: 'spam', label: 'Spam or unwanted content', icon: 'mail-outline', description: 'Repetitive, promotional, or irrelevant content' },
                { key: 'harassment', label: 'Harassment or bullying', icon: 'person-remove-outline', description: 'Targeting individuals with harmful behavior' },
                { key: 'inappropriate', label: 'Inappropriate content', icon: 'warning-outline', description: 'Content not suitable for this platform' },
                { key: 'misinformation', label: 'False or misleading information', icon: 'information-circle-outline', description: 'Spreading incorrect or unverified claims' },
                { key: 'hate_speech', label: 'Hate speech or discrimination', icon: 'ban-outline', description: 'Content promoting hatred against groups' },
                { key: 'violence', label: 'Violence or threats', icon: 'alert-circle-outline', description: 'Threatening or promoting violent behavior' },
                { key: 'other', label: 'Other violation', icon: 'ellipsis-horizontal-outline', description: 'Violates community guidelines in other ways' }
              ].map((reason) => (
                <TouchableOpacity
                  key={reason.key}
                  style={[
                    styles.reportOption,
                    selectedReportReasons.includes(reason.key) && styles.selectedReportOption
                  ]}
                  onPress={() => toggleReportReason(reason.key)}
                >
                  <View style={styles.reportOptionContent}>
                    <View style={styles.reportOptionHeader}>
                      <View style={styles.reportOptionLeft}>
                        <View style={[
                          styles.iconContainer,
                          selectedReportReasons.includes(reason.key) && styles.selectedIconContainer
                        ]}>
                          <Ionicons 
                            name={reason.icon as any} 
                            size={rf(22)} 
                            color={selectedReportReasons.includes(reason.key) ? "#FFFFFF" : "#6B7280"} 
                          />
                        </View>
                        <View style={styles.reportOptionTextContainer}>
                          <Text style={[
                            styles.reportOptionText,
                            selectedReportReasons.includes(reason.key) && styles.selectedReportOptionText
                          ]}>
                            {reason.label}
                          </Text>
                          <Text style={styles.reportOptionDescription}>
                            {reason.description}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedReportReasons.includes(reason.key) && styles.checkedCheckbox
                      ]}>
                        {selectedReportReasons.includes(reason.key) && (
                          <Ionicons name="checkmark" size={rf(16)} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.reportFooterInfo}>
              <Text style={styles.reportFooterText}>
                Your report helps keep our community safe. All reports are reviewed by our moderation team.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: rs(16),
  },
  writeReviewButton: {
    backgroundColor: '#FF6B35', // Vibrant orange-red for attention
    paddingHorizontal: rs(24),
    paddingVertical: rs(14),
    borderRadius: rs(25), // More rounded for modern look
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
    borderWidth: 2,
    borderColor: '#FF8A65', // Lighter border for depth
    transform: [{ scale: 1.05 }], // Slightly larger for attention
  },
  writeReviewText: {
    fontSize: rf(16), // Bigger text
    fontWeight: '800', // Extra bold
    color: COLORS.surface,
    letterSpacing: 1.2, // More spacing for impact
    textTransform: 'uppercase',
  },
  
  // Rules
  rulesContainer: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    padding: rs(12),
    borderRadius: rs(8),
    marginBottom: rs(16),
  },
  rulesTitle: {
    fontSize: rf(13),
    fontWeight: '500',
    color: '#8B4513',
    marginBottom: rs(4),
  },
  rulesSubtitle: {
    fontSize: rf(12),
    color: '#8B4513',
  },
  
  // Sort Options
  sortContainer: {
    flexDirection: 'row',
    marginBottom: rs(20),
    backgroundColor: COLORS.background,
    borderRadius: rs(8),
    padding: rs(4),
  },
  sortButton: {
    flex: 1,
    paddingVertical: rs(10),
    paddingHorizontal: rs(16),
    borderRadius: rs(6),
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: rf(14),
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeSortButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  
  // Review Item
  reviewContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rs(12),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: rs(4),
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: rs(12),
    marginLeft: rs(8),
  },
  ownerBadgeText: {
    fontSize: rf(10),
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: rs(2),
  },
  ratingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  reviewTime: {
    fontSize: rf(12),
    color: COLORS.textSecondary,
  },
  moreButton: {
    padding: rs(4),
  },
  reviewText: {
    fontSize: rf(14),
    color: COLORS.text,
    lineHeight: rf(20),
    marginBottom: rs(12),
  },
  
  // Review Actions - Enhanced with feedback
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(24),
    marginTop: rs(4),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(20),
  },
  likedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  dislikedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  processingButton: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  actionText: {
    fontSize: rf(14),
    color: '#8E8E93',
    fontWeight: '600',
  },
  
  // Stars - Enhanced for modal
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: rs(2),
  },
  interactiveStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(20),
    paddingHorizontal: rs(16),
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: rs(20),
    marginVertical: rs(16),
  },
  interactiveStarButton: {
    padding: rs(8),
    borderRadius: rs(25),
    marginHorizontal: rs(4),
  },
  interactiveStarIcon: {
    // No margin needed as we have padding on the button
  },
  
  // Reply Input
  replyInputContainer: {
    marginTop: rs(12),
    padding: rs(12),
    backgroundColor: COLORS.background,
    borderRadius: rs(8),
  },
  replyInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: rs(8),
    padding: rs(12),
    fontSize: rf(14),
    color: COLORS.text,
    minHeight: rs(80),
    textAlignVertical: 'top',
  },
  replyInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: rs(12),
    marginTop: rs(8),
  },
  cancelReplyButton: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
  },
  cancelReplyText: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  submitReplyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(6),
  },
  submitReplyText: {
    fontSize: rf(14),
    color: COLORS.surface,
    fontWeight: '600',
  },
  
  // Replies Section
  repliesSection: {
    marginTop: rs(12),
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginBottom: rs(8),
  },
  viewRepliesText: {
    fontSize: rf(13),
    color: COLORS.primary,
    fontWeight: '500',
  },
  repliesList: {
    paddingLeft: rs(16),
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  
  // Reply Item
  replyContainer: {
    marginBottom: rs(12),
    paddingBottom: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  replyUserInfo: {
    flex: 1,
  },
  replyUserName: {
    fontSize: rf(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: rs(2),
  },
  replyTime: {
    fontSize: rf(11),
    color: COLORS.textSecondary,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(16),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingVertical: rs(2),
  },
  dislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingVertical: rs(2),
  },
  likeCount: {
    fontSize: rf(12),
    color: '#8E8E93',
    fontWeight: '600',
  },
  dislikeCount: {
    fontSize: rf(12),
    color: '#8E8E93',
    fontWeight: '600',
  },
  replyText: {
    fontSize: rf(13),
    color: COLORS.text,
    lineHeight: rf(18),
  },
  
  // Add Review Modal - Enhanced UI
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(24),
    paddingVertical: rs(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  modalTitle: {
    fontSize: rf(22),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: rs(16),
  },
  modalCloseButton: {
    padding: rs(8),
    borderRadius: rs(20),
    backgroundColor: COLORS.background,
  },
  modalSubmitButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    minWidth: rs(60), // Ensure minimum width for "Post"
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    fontSize: rf(18),
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: rs(24),
    paddingVertical: rs(32),
  },
  ratingLabel: {
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: rs(8),
    textAlign: 'center',
  },
  ratingInstruction: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: rs(12),
    fontStyle: 'italic',
  },
  reviewLabel: {
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.text,
    marginTop: rs(40),
    marginBottom: rs(8),
  },
  reviewInstruction: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    marginBottom: rs(16),
    lineHeight: rf(22),
  },
  reviewInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: rs(16),
    padding: rs(24),
    fontSize: rf(18),
    color: COLORS.text,
    minHeight: rs(180),
    textAlignVertical: 'top',
    backgroundColor: COLORS.background,
    lineHeight: rf(26),
  },
  characterCount: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: rs(12),
    fontWeight: '500',
  },
  
  // Tips Section
  tipsContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: rs(16),
    padding: rs(20),
    marginTop: rs(32),
    marginBottom: rs(20),
    borderLeftWidth: rs(4),
    borderLeftColor: COLORS.primary,
  },
  tipsTitle: {
    fontSize: rf(18),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: rs(12),
  },
  tipText: {
    fontSize: rf(15),
    color: COLORS.textSecondary,
    lineHeight: rf(22),
    marginBottom: rs(6),
  },
  
  // Report Modal - Full Screen
  reportModalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  closeButton: {
    padding: rs(8),
    borderRadius: rs(20),
    backgroundColor: COLORS.background,
  },
  reportModalTitle: {
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: rs(16),
  },
  submitHeaderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rs(20),
  },
  disabledSubmitHeaderButton: {
    backgroundColor: COLORS.border,
  },
  submitHeaderButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.surface,
  },
  disabledSubmitHeaderButtonText: {
    color: COLORS.textSecondary,
  },
  reportModalContent: {
    flex: 1,
    paddingHorizontal: rs(20),
  },
  reportModalSubtitle: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    lineHeight: rf(24),
    marginVertical: rs(20),
  },
  reportOptionsContainer: {
    marginBottom: rs(20),
  },
  reportOption: {
    backgroundColor: COLORS.background,
    borderRadius: rs(16),
    marginBottom: rs(12),
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedReportOption: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  reportOptionContent: {
    padding: rs(20),
  },
  reportOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(16),
  },
  selectedIconContainer: {
    backgroundColor: COLORS.primary,
  },
  reportOptionTextContainer: {
    flex: 1,
  },
  reportOptionText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: rs(4),
  },
  selectedReportOptionText: {
    color: COLORS.primary,
  },
  reportOptionDescription: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    lineHeight: rf(20),
  },
  checkbox: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(16),
  },
  checkedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reportFooterInfo: {
    backgroundColor: COLORS.background,
    padding: rs(20),
    borderRadius: rs(12),
    marginBottom: rs(40),
  },
  reportFooterText: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: rf(20),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(60),
    paddingHorizontal: rs(40),
  },
  emptyStateTitle: {
    fontSize: rf(20),
    fontWeight: '600',
    color: COLORS.text,
    marginTop: rs(20),
    marginBottom: rs(8),
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: rf(24),
    marginBottom: rs(30),
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(32),
    paddingVertical: rs(16),
    borderRadius: rs(25),
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
  },
  emptyStateButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.surface,
  },
});