import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Place } from '../types';
import { LocationService } from '../services/location.service';
import { COLORS, PLACE_TYPES } from '../utils/constants';
import { getResponsiveDimensions, rs, rf } from '../utils/responsive';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const responsiveDimensions = getResponsiveDimensions();

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const placeTypeLabel = PLACE_TYPES.find(type => type.value === place.type)?.label || place.type;
  const distanceText = place.distance ? LocationService.formatDistance(place.distance) : '0m';
  const walkingTime = place.distance ? LocationService.formatWalkingTime(place.distance) : '0min walk';
  
  // Debug logging for images
  if (place.photo) {
    console.log(`🖼️ PlaceCard Image URL for ${place.title}:`, place.photo);
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
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
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
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="mosque" size={rf(32)} color={COLORS.surface} />
            {imageError && (
              <Text style={styles.errorText}>Image unavailable</Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {place.title}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{placeTypeLabel}</Text>
          </View>
        </View>
        
        {/* Address display */}
        {place.address && (
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={rf(14)} color={COLORS.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
        )}
        
        <View style={styles.details}>
          <Text style={styles.distance}>{distanceText}</Text>
          <Text style={styles.walkingTime}>{walkingTime}</Text>
        </View>
        
        {amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {amenities.map((amenityKey) => (
              <View key={amenityKey} style={styles.amenityIcon}>
                {amenityKey === 'wuzu' && <MaterialIcons name="water-drop" size={rf(18)} color="#6B7280" />}
                {amenityKey === 'washroom' && <MaterialIcons name="bathroom" size={rf(18)} color="#6B7280" />}
                {amenityKey === 'women_area' && <MaterialIcons name="female" size={rf(18)} color="#6B7280" />}
              </View>
            ))}
          </View>
        )}
        
        {place.capacity && (
          <Text style={styles.capacity}>Capacity: {place.capacity}</Text>
        )}
      </View>
      
      <View style={styles.arrow}>
        <Feather name="chevron-right" size={rf(24)} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: rs(16),
    marginHorizontal: responsiveDimensions.cardMargin,
    marginVertical: rs(8),
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: rf(10),
    color: COLORS.surface,
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
    color: COLORS.text,
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
    color: COLORS.textSecondary,
    marginLeft: rs(4),
    flex: 1,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(16),
  },
  typeText: {
    fontSize: rf(12),
    color: COLORS.surface,
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
    color: COLORS.primary,
  },
  walkingTime: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    marginTop: rs(2),
    fontWeight: '500',
  },
  arrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: rs(24),
  },

});
