import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { Place, Review, ReviewSortOption } from "../types";
import { PlacesService } from "../services/places.service";
import { ReviewsService } from "../services/reviews.service";
import { LocationService } from "../services/location.service";
import { COLORS, PLACE_TYPES } from "../utils/constants";
import { getResponsiveDimensions, rs, rf } from "../utils/responsive";
import { ReviewsSection } from "../components/ReviewsSection";




interface PlaceDetailScreenProps {
  route: {
    params: {
      placeId: string;
    };
  };
  navigation: any;
}

const { width } = Dimensions.get('window');
const responsiveDimensions = getResponsiveDimensions();

export const PlaceDetailScreen: React.FC<PlaceDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { placeId } = route.params;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('newest');
  const buttonScale = new Animated.Value(1);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Mock current user ID (in real app, get from auth context)
  const currentUserId = 'current_user_123';

  // Test database connection on component mount
  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('🔄 Starting database diagnostics...');
        await ReviewsService.testConnection();
        console.log('✅ All database tests passed!');
      } catch (error) {
        console.error('❌ DATABASE SETUP ISSUE:', error);
        
        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        
        if (errorMessage.includes('REVIEWS TABLE MISSING')) {
          Alert.alert(
            'Database Setup Required',
            'The reviews system needs to be set up. Please run the SQL setup file in your Supabase dashboard.',
            [{ text: 'OK' }]
          );
        } else if (errorMessage.includes('NO PLACES IN DATABASE')) {
          Alert.alert(
            'No Places Found',
            'You need to add some places to your database before you can review them.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Database Connection Issue',
            `There's an issue with the database: ${errorMessage}`,
            [{ text: 'OK' }]
          );
        }
      }
    };
    
    testDatabase();
  }, []);

  // Header configuration is now handled by navigator

  // Star Rating Component - Professional star icons instead of emojis
  const renderStarRating = (rating: number, reviewCount?: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Professional star rating - Perfect size for visibility
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialIcons key={`full-${i}`} name="star" size={rf(22)} color="#F59E0B" style={styles.starIcon} />
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <MaterialIcons key="half" name="star-half" size={rf(22)} color="#F59E0B" style={styles.starIcon} />
      );
    }
    
    // Empty stars with subtle gray
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MaterialIcons key={`empty-${i}`} name="star-outline" size={rf(22)} color="#D1D5DB" style={styles.starIcon} />
      );
    }
    
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {stars}
        </View>
        <Text style={styles.ratingText}>
          {rating > 0 ? rating.toFixed(1) : '0.0'} {
            reviewCount === 0 ? '(No reviews yet)' : 
            reviewCount === 1 ? '(1 review)' : 
            reviewCount ? `(${reviewCount} reviews)` : '(No reviews yet)'
          }
        </Text>
      </View>
    );
  };

  useEffect(() => {
    fetchPlaceDetails();
    fetchReviews();
  }, [placeId]);

  useEffect(() => {
    if (reviewSort) {
      fetchReviews();
    }
  }, [reviewSort]);

  const fetchPlaceDetails = async () => {
    try {
      const placeData = await PlacesService.getPlaceById(placeId);
      setPlace(placeData);
    } catch (error) {
      console.error("Error fetching place details:", error);
      Alert.alert("Error", "Unable to load place details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsData = await ReviewsService.getReviewsForPlace(placeId, reviewSort);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Keep existing reviews or show empty state
      setReviews([]);
    }
  };

  const handleGetDirections = () => {
    if (!place) return;

    // Add button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const url = `geo:${place.latitude},${place.longitude}?q=${place.latitude},${place.longitude}(${place.title})`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Unable to open maps application");
        }
      })
      .catch((err) => {
        console.error("Error opening maps:", err);
        Alert.alert("Error", "Unable to open directions");
      });
  };

  const handleCall = () => {
    // Check if place has contact phone from owner's profile
    if (!place?.contact_phone) {
      Alert.alert(
        "No Contact Number", 
        "The place owner hasn't provided a contact number yet.",
        [{ text: "OK" }]
      );
      return;
    }

    const phoneUrl = `tel:${place.contact_phone}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Error", "Unable to make phone calls");
        }
      })
      .catch((err) => {
        console.error("Error making call:", err);
        Alert.alert("Error", "Unable to make call");
      });
  };

  const handleWhatsApp = () => {
    // Check if place has WhatsApp number from owner's profile
    if (!place?.whatsapp_number) {
      Alert.alert(
        "No WhatsApp Number", 
        "The place owner hasn't provided a WhatsApp number yet.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Remove any non-numeric characters and ensure proper format
    const cleanNumber = place.whatsapp_number.replace(/[^0-9]/g, '');
    const message = `Hi! I found your place "${place?.title}" on Mawqif app. I'd like to know more about it.`;
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webWhatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((err) => {
        console.error("Error opening WhatsApp:", err);
        Alert.alert("Error", "Unable to open WhatsApp");
      });
  };

  // Review handling functions
  const handleAddReview = async (rating: number, comment: string) => {
    try {
      console.log('🔄 Adding review:', { placeId, currentUserId, rating, comment });
      await ReviewsService.addReview(placeId, currentUserId, 'Current User', rating, comment);
      Alert.alert('Success', 'Your review has been added successfully!');
      fetchReviews(); // Refresh reviews
      fetchPlaceDetails(); // Refresh place rating
    } catch (error) {
      console.error('❌ Error adding review:', error);
      
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Unable to add review: ${errorMessage}`);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    try {
      await ReviewsService.likeReview(reviewId, currentUserId);
      fetchReviews(); // Refresh to show updated counts
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDislikeReview = async (reviewId: string) => {
    try {
      await ReviewsService.dislikeReview(reviewId, currentUserId);
      fetchReviews(); // Refresh to show updated counts
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  const handleReplyToReview = async (reviewId: string, comment: string) => {
    try {
      const isOwner = currentUserId === place?.owner_id;
      await ReviewsService.addReply(reviewId, currentUserId, 'Current User', comment, isOwner);
      Alert.alert('Success', 'Your reply has been added successfully!');
      fetchReviews(); // Refresh to show new reply
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Unable to add reply. Please try again.');
    }
  };

  const handleReportReview = async (reviewId: string, reason: string) => {
    try {
      await ReviewsService.reportReview(reviewId, currentUserId, reason);
      Alert.alert('Reported', 'Thank you for reporting. We will review this content.');
    } catch (error) {
      console.error('Error reporting review:', error);
      Alert.alert('Error', 'Unable to report review. Please try again.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await ReviewsService.deleteReview(reviewId, currentUserId);
      Alert.alert('Deleted', 'Review has been deleted successfully.');
      fetchReviews(); // Refresh reviews
      fetchPlaceDetails(); // Refresh place rating
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'Unable to delete review. Please try again.');
    }
  };

  const handleSortChange = (sortOption: ReviewSortOption) => {
    setReviewSort(sortOption);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Place not found</Text>
        </View>
      </View>
    );
  }

  const placeTypeLabel =
    PLACE_TYPES.find((type) => type.value === place.type)?.label || place.type;
  const distanceText = place.distance
    ? LocationService.formatDistance(place.distance)
    : "";
  const walkingTime = place.distance
    ? LocationService.formatWalkingTime(place.distance)
    : "";

  const amenities = Object.entries(place.amenities ?? {})
    .filter(([_, value]) => value)
    .map(([key, _]) => ({
      key,
      label: key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }));

  // Get all images (multiple photos or single photo)
  const allImages = place.photos && place.photos.length > 0 
    ? place.photos 
    : place.photo 
    ? [place.photo] 
    : [];

  const renderImageCarousel = () => {
    if (allImages.length === 0) {
      return (
        <View style={styles.placeholderImage}>
          <MaterialIcons name="location-on" size={rf(64)} color={COLORS.textSecondary} />
        </View>
      );
    }

    if (allImages.length === 1) {
      return (
        <Image source={{ uri: allImages[0] }} style={styles.image} />
      );
    }

    return (
      <View style={styles.carouselContainer}>
        <FlatList
          data={allImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={[styles.image, { width }]} />
          )}
        />
        
        {/* Image indicators */}
        <View style={styles.imageIndicators}>
          {allImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentImageIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

        {/* Image Carousel Section */}
        <View style={styles.imageContainer}>
          {renderImageCarousel()}
        </View>

        <View style={styles.content}>
          {/* Header with Title and Type */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{place.title}</Text>
              {/* Address below title */}
              {place.address && (
                <View style={styles.addressContainer}>
                  <MaterialIcons name="location-on" size={rf(16)} color={COLORS.textSecondary} />
                  <Text style={styles.addressText}>{place.address}</Text>
                </View>
              )}
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{placeTypeLabel}</Text>
            </View>
          </View>

          {/* Star Rating Section */}
          <View style={styles.ratingSection}>
            {renderStarRating(
              place?.avg_rating || 0, 
              place?.review_count || 0
            )}
          </View>

          {/* Status and Location Info Combined */}
          <View style={styles.statusLocationContainer}>
            {/* Open/Closed Status */}
            <View style={[
              styles.statusBadge, 
              place.is_open ? styles.openBadge : styles.closedBadge
            ]}>
              <View style={styles.statusContent}>
                <MaterialIcons 
                  name={place.is_open ? "schedule" : "access-time"} 
                  size={rf(18)} 
                  color={place.is_open ? "#22C55E" : "#EF4444"} 
                  style={styles.statusIcon}
                />
                <Text style={[
                  styles.statusText,
                  place.is_open ? styles.openText : styles.closedText
                ]}>
                  {place.is_open ? "Open Now" : "Closed"}
                </Text>
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.locationDetails}>
              {distanceText ? <Text style={styles.distance}>{distanceText}</Text> : null}
              {walkingTime ? <Text style={styles.walkingTime}>{walkingTime}</Text> : null}
              <Text style={styles.city}>{place.city}</Text>
            </View>
          </View>

          {/* Capacity */}
          {place.capacity && (
            <View style={styles.capacityContainer}>
              <Text style={styles.capacityLabel}>Capacity:</Text>
              <Text style={styles.capacityValue}>{place.capacity} people</Text>
            </View>
          )}

          {/* Amenities - Professional icons instead of emojis */}
          {amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
              <Text style={styles.amenitiesTitle}>Available Amenities:</Text>
              <View style={styles.amenitiesList}>
                {amenities.map((amenity) => (
                  <View key={amenity.key} style={styles.amenityItem}>
                    {/* Professional amenity icons - Optimal size for clarity */}
                    {amenity.key === 'wuzu' && <MaterialIcons name="water-drop" size={rf(20)} color="#6B7280" style={styles.amenityIconStyle} />}
                    {amenity.key === 'washroom' && <MaterialIcons name="bathroom" size={rf(20)} color="#6B7280" style={styles.amenityIconStyle} />}
                    {amenity.key === 'women_area' && <MaterialIcons name="female" size={rf(20)} color="#6B7280" style={styles.amenityIconStyle} />}
                    <Text style={styles.amenityLabel}>{amenity.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact Information - Always show */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Contact Information:</Text>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleCall}
            >
              <MaterialIcons name="call" size={rf(28)} color={COLORS.primary} style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Call</Text>
                <Text style={styles.contactNumber}>
                  {place.contact_phone || "Not provided"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.whatsappButton}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={rf(28)} color="#25D366" style={styles.whatsappIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.whatsappLabel}>WhatsApp</Text>
                <Text style={styles.contactNumber}>
                  {place.whatsapp_number ? "Chat" : "Not provided"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Review Section Hint */}
          <View style={styles.reviewHintContainer}>
            <Text style={styles.reviewHintText}>
              <MaterialIcons name="reviews" size={rf(20)} color={COLORS.textSecondary} style={{ marginRight: rs(6) }} />
              Check reviews and ratings from other users below
            </Text>
          </View>

          {/* Enhanced Reviews Section */}
          <ReviewsSection
            placeId={placeId}
            placeOwnerId={place.owner_id}
            currentUserId={currentUserId}
            reviews={reviews}
            onAddReview={handleAddReview}
            onLikeReview={handleLikeReview}
            onDislikeReview={handleDislikeReview}
            onReplyToReview={handleReplyToReview}
            onReportReview={handleReportReview}
            onDeleteReview={handleDeleteReview}
            onSortChange={handleSortChange}
            currentSort={reviewSort}
          />

        </View>
      </Animated.ScrollView>

      {/* Floating Get Directions Button */}
      <Animated.View style={[styles.floatingDirectionsButton, { transform: [{ scale: buttonScale }] }]}>
        <TouchableOpacity
          style={styles.floatingButtonTouchable}
          onPress={handleGetDirections}
          activeOpacity={0.8}
        >
          <View style={styles.floatingDirectionsContent}>
            <MaterialIcons name="navigation" size={rf(24)} color={COLORS.surface} />
            <Text style={styles.floatingDirectionsText}>Get Directions</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: rf(16),
    color: COLORS.error,
  },
  
  // Image Carousel Styles
  imageContainer: {
    height: 300,
    backgroundColor: COLORS.surface,
  },
  carouselContainer: {
    position: 'relative',
  },
  image: {
    width: "100%",
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: rs(16),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: rs(4),
  },
  activeIndicator: {
    backgroundColor: COLORS.surface,
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  
  // Content Styles
  content: {
    padding: responsiveDimensions.cardPadding,
    paddingBottom: rs(100), // Extra padding for floating button
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: rs(12),
  },
  title: {
    fontSize: responsiveDimensions.titleSize,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: rs(12),
  },
  titleContainer: {
    flex: 1,
    marginRight: rs(12),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(6),
  },
  addressText: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    marginLeft: rs(4),
    flex: 1,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(16),
  },
  typeText: {
    fontSize: rf(14),
    color: COLORS.surface,
    fontWeight: "500",
  },
  
  // Star Rating Styles - Clean and professional
  ratingSection: {
    marginBottom: rs(12),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: rs(8),
  },
  starIcon: {
    marginRight: rs(2),
  },
  ratingText: {
    fontSize: rf(14),
    color: COLORS.text,
    fontWeight: '600',
  },
  
  // Status and Location Combined
  statusLocationContainer: {
    marginBottom: rs(10),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(16),
    borderWidth: 1,
    marginBottom: rs(8),
  },
  openBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
  },
  closedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: rs(4),
  },
  statusText: {
    fontSize: rf(12),
    fontWeight: '600',
  },
  openText: {
    color: '#22C55E',
  },
  closedText: {
    color: '#EF4444',
  },
  
  // Location Details
  locationDetails: {
    // No extra margin needed since it's in the combined container
  },
  distance: {
    fontSize: rf(18),
    fontWeight: "600",
    color: COLORS.primary,
  },
  walkingTime: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    marginTop: rs(1),
  },
  city: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    marginTop: rs(2),
  },
  
  // Capacity
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  
  // Amenities
  amenitiesContainer: {
    marginBottom: rs(16),
  },
  amenitiesTitle: {
    fontSize: rf(16),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: rs(10),
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityIconStyle: {
    marginRight: rs(6),
  },
  amenityLabel: {
    fontSize: rf(12),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Contact Information
  contactContainer: {
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  contactIcon: {
    marginRight: rs(16),
  },
  whatsappIcon: {
    marginRight: rs(16),
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  whatsappLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Review Hint
  reviewHintContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  reviewHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Floating Directions Button
  floatingDirectionsButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 1000,
  },
  floatingButtonTouchable: {
    paddingVertical: rs(16),
    paddingHorizontal: rs(20),
    alignItems: "center",
    borderRadius: rs(12),
  },
  floatingDirectionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minWidth: rs(200), // Ensure minimum width
  },
  floatingDirectionsText: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.surface,
    flexShrink: 0,
    marginLeft: rs(8), // Add margin instead of style prop
  },
});
