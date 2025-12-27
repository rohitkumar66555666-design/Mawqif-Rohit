import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Place } from '../types';
import { LocationService } from '../services/location.service';
import { BookmarksService } from '../services/bookmarks.service';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserInfo, useBookmarkAuth } from '../lib/authHelper';
import { PLACE_TYPES } from '../utils/constants';
import { getResponsiveDimensions, rs, rf } from '../utils/responsive';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  navigation?: any; // Optional navigation prop for auth
}

const { width } = Dimensions.get('window');
const responsiveDimensions = getResponsiveDimensions();

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useUserInfo();
  const { requireBookmarkAuth } = useBookmarkAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  
  const placeTypeLabel = t(place.type);
  const distanceText = place.distance ? LocationService.formatDistance(place.distance) : '0m';
  const walkingTime = place.distance ? LocationService.formatWalkingTime(place.distance) : '0min walk';
  
  // Check bookmark status when component mounts or user changes
  useEffect(() => {
    checkBookmarkStatus();
  }, [user, place.id]);

  const checkBookmarkStatus = async () => {
    if (!user?.uid) {
      setIsBookmarked(false);
      return;
    }

    try {
      const bookmarked = await BookmarksService.isBookmarked(user.uid, place.id);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmarkPress = async () => {
    // Check authentication first
    const proceedWithBookmark = async () => {
      if (!user?.uid) return;

      try {
        setBookmarkLoading(true);
        const newBookmarkStatus = await BookmarksService.toggleBookmark(user.uid, place.id);
        setIsBookmarked(newBookmarkStatus);
        
        const message = newBookmarkStatus ? t('bookmarkAdded') : t('bookmarkRemoved');
        // You could show a toast here instead of alert for better UX
        console.log(message);
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        
        // Check if it's a table missing error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('relation "bookmarks" does not exist') || 
            errorMessage.includes('table "bookmarks" does not exist')) {
          Alert.alert(
            'Database Setup Required',
            'The bookmarks feature requires database setup. Please run the setup script in Supabase.',
            [{ text: t('ok') }]
          );
        } else {
          Alert.alert(t('error'), t('failedToUpdateBookmark'));
        }
      } finally {
        setBookmarkLoading(false);
      }
    };

    // Require authentication for bookmarking
    if (navigation) {
      requireBookmarkAuth(navigation, proceedWithBookmark);
    } else {
      proceedWithBookmark();
    }
  };
  
  // Debug logging for images and validate URL
  if (place.photo) {
    console.log(`🖼️ PlaceCard Image URL for ${place.title}:`, place.photo);
    
    // Check for invalid URL schemes
      if (place.photo.startsWith('blob:') || 
        place.photo.startsWith('file:') || 
        place.photo.startsWith('content:') ||
        place.photo.startsWith('ph:')) {
      console.warn(`⚠️ Invalid URL scheme detected for ${place.title}:`, place.photo);
      // Don't try to load invalid URLs
      place.photo = undefined;
    }
  }

  // Get amenity icons for display
  const amenities = Object.entries(place.amenities ?? {})
    .filter(([_, value]) => value)
    .map(([key, _]) => key);

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for: ${place.title}`);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (error: any) => {
    console.error(`❌ Image failed to load for ${place.title}:`, error.nativeEvent?.error || 'Unknown error');
    console.error(`❌ Image URL was:`, place.photo);
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
        {place.photo && !imageError ? (
          <>
            <Image 
              source={{ uri: place.photo }} 
              style={styles.image}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
              // Removed defaultSource to prevent fallback image issues
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons name="mosque" size={rf(32)} color={colors.textInverse} />
            {imageError && (
              <Text style={[styles.errorText, { color: colors.textInverse }]}>{t('imageUnavailable')}</Text>
            )}
          </View>
        )}
        {/* Bookmark Button */}
        <TouchableOpacity
          style={[styles.bookmarkButton, { backgroundColor: isBookmarked ? colors.primary : colors.surface }]}
          onPress={handleBookmarkPress}
          disabled={bookmarkLoading}
        >
          {bookmarkLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons 
              name={isBookmarked ? "bookmark" : "bookmark-border"} 
              size={rf(20)} 
              color={isBookmarked ? colors.textInverse : colors.textSecondary} 
            />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {String(place.title)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.typeText, { color: colors.textInverse }]}>{String(t(place.type))}</Text>
          </View>
        </View>
        
        {/* Address display */}
        {place.address && (
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={rf(14)} color={colors.textSecondary} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
              {String(place.address)}
            </Text>
          </View>
        )}
        
        <View style={styles.details}>
          <Text style={[styles.distance, { color: colors.primary }]}>{String(distanceText)}</Text>
          <Text style={[styles.walkingTime, { color: colors.textSecondary }]}>{String(walkingTime)}</Text>
        </View>
        
        {amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {amenities.map((amenityKey) => (
              <View key={amenityKey} style={styles.amenityIcon}>
                {amenityKey === 'wuzu' && <MaterialIcons name="water-drop" size={rf(18)} color={colors.textSecondary} />}
                {amenityKey === 'washroom' && <MaterialIcons name="bathroom" size={rf(18)} color={colors.textSecondary} />}
                {amenityKey === 'women_area' && <MaterialIcons name="female" size={rf(18)} color={colors.textSecondary} />}
              </View>
            ))}
          </View>
        )}
        
        {place.capacity && (
          <Text style={[styles.capacity, { color: colors.textSecondary }]}>{String(t('capacity'))}: {String(place.capacity)}</Text>
        )}
      </View>
      
      <View style={styles.arrow}>
        <Feather name="chevron-right" size={rf(24)} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: rs(16),
    marginHorizontal: responsiveDimensions.cardMargin,
    marginVertical: rs(8),
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.08,
    shadowRadius: rs(4),
    minHeight: rs(110),
  },
  imageContainer: {
    width: rs(90),
    height: rs(90),
    borderRadius: rs(16),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(3),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: rf(10),
    marginTop: rs(4),
    textAlign: 'center',
  },

  content: {
    flex: 1,
    marginLeft: rs(16),
    justifyContent: 'space-between',
    paddingVertical: rs(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: rf(16),
    fontWeight: '600',
    flex: 1,
    marginRight: rs(8),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(2),
    marginBottom: rs(2),
  },
  addressText: {
    fontSize: rf(13),
    marginLeft: rs(4),
    flex: 1,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(16),
  },
  typeText: {
    fontSize: rf(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  details: {
    marginTop: rs(4),
  },
  distance: {
    fontSize: rf(15),
    fontWeight: '700',
  },
  walkingTime: {
    fontSize: rf(14),
    marginTop: rs(2),
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    marginTop: rs(4),
    gap: rs(6),
  },
  amenityIcon: {
    // Icon styling handled by MaterialIcons component
  },
  capacity: {
    fontSize: rf(13),
    marginTop: rs(2),
    fontWeight: '500',
  },
  arrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: rs(24),
  },

  // Bookmark Button
  bookmarkButton: {
    position: 'absolute',
    top: rs(8),
    right: rs(8),
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(3),
  },

});
