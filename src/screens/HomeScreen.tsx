import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { Place, Location } from "../types";
import { PlaceCard } from "../components/PlaceCard";
import { SearchBar } from "../components/SearchBar";
import { FilterModal, FilterOptions } from "../components/FilterModal";


import { LocationService } from "../services/location.service";
import { PlacesService } from "../services/places.service";
import { ImageUploadService } from "../services/image-upload.service";
import { COLORS } from "../utils/constants";
import { getResponsiveDimensions, rs, rf } from "../utils/responsive";
import { ImageDebugger } from "../utils/imageDebug";

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false); // Track if we've loaded data successfully

  const [filters, setFilters] = useState<FilterOptions>({
    createdTime: null,
    rating: null,
    womenArea: false,
    radius: null, // No radius filter by default - show all places
    capacity: null,
    placeType: null,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  // Debounced search effect to prevent keyboard dismissal
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  useEffect(() => {
    if (userLocation && !hasLoadedData) {
      console.log('🎯 First time loading places for user location');
      fetchNearbyPlaces();
    } else if (userLocation && hasLoadedData) {
      console.log('🔒 User location changed but data already loaded - PRESERVING distances');
    }
  }, [userLocation]);

  useEffect(() => {
    // Apply filters and search whenever they change
    applyFiltersAndSearch();
  }, [allPlaces, filters, debouncedSearchText]); // Use debouncedSearchText instead of searchText

  const initializeLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request location permission
      const hasPermission = await LocationService.requestPermission();
      if (!hasPermission) {
        setError(
          "Location permission is required to find nearby prayer spaces"
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);

      // Proactive caching disabled to prevent interference with distance preservation
      console.log('📱 Proactive caching disabled - focusing on distance preservation');

    } catch (err) {
      console.error("Error initializing location:", err);
      setError("Unable to get your location. Please check your GPS settings.");
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (forceRefresh: boolean = false) => {
    if (!userLocation) return;

    // Only skip reload if we have data AND it's not a forced refresh AND not the initial load
    if (hasLoadedData && !forceRefresh && allPlaces.length > 0) {
      console.log(`🔒 PRESERVING existing ${allPlaces.length} places - NO RELOAD`);
      return;
    }

    try {
      setError(null);
      console.log(`🔄 Loading places from Supabase...`);
      
      // Always fetch fresh data from Supabase
      const nearbyPlaces = await PlacesService.getNearbyPlaces(
        userLocation,
        100000 // Increased radius to 100km to catch more places
      );
      
      console.log(`📊 Fetched ${nearbyPlaces.length} places from database`);
      
      if (nearbyPlaces.length > 0) {
        console.log(`✅ Loaded ${nearbyPlaces.length} fresh places with distances`);
        console.log(`📍 Sample places:`, nearbyPlaces.slice(0, 3).map(p => `${p.title} (${p.distance}m)`));
        
        // Debug image URLs for first 3 places
        console.log('🖼️ Debugging image URLs...');
        nearbyPlaces.slice(0, 3).forEach(place => {
          ImageDebugger.logImageInfo(place.title, place.photo);
        });
        
        setAllPlaces(nearbyPlaces);
        setHasLoadedData(true);
      } else {
        console.log(`⚠️ No places found in database`);
        setAllPlaces([]);
        setError("No places found in your area.");
      }

    } catch (err) {
      console.error("❌ Error fetching places:", err);
      setError("Unable to load places. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSearch = () => {
    console.log(`🔍 Applying filters and search to ${allPlaces.length} places`);
    console.log(`🔍 Search text: "${debouncedSearchText}"`);
    console.log(`🔍 Filters:`, filters);
    console.log(`🔍 Sample place distances:`, allPlaces.slice(0, 3).map(p => `${p.title}: ${p.distance}m`));
    
    let filtered = [...allPlaces];

    // Search filter (city, title, address) - use debounced search text
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (place) =>
          place.title.toLowerCase().includes(searchLower) ||
          place.city.toLowerCase().includes(searchLower) ||
          (place.address && place.address.toLowerCase().includes(searchLower))
      );
      console.log(`🔍 Search filtered: ${beforeSearch} → ${filtered.length} places`);
    }

    // Radius filter - be more lenient with missing distance data
    if (filters.radius && userLocation) {
      const beforeRadius = filtered.length;
      filtered = filtered.filter(
        (place) => {
          if (!place.distance && place.distance !== 0) {
            console.log(`⚠️ Place ${place.title} has no distance - including it anyway`);
            return true; // Include places without distance data
          }
          // Ensure distance is in meters for comparison
          const distanceInMeters = place.distance;
          const withinRadius = distanceInMeters <= filters.radius!;
          if (!withinRadius) {
            console.log(`📏 ${place.title}: ${distanceInMeters}m > ${filters.radius}m (filtered out)`);
          }
          return withinRadius;
        }
      );
      console.log(`🔍 Radius filtered: ${beforeRadius} → ${filtered.length} places`);
    }

    // Place type filter
    if (filters.placeType) {
      const beforeType = filtered.length;
      filtered = filtered.filter((place) => place.type === filters.placeType);
      console.log(`🔍 Type filtered: ${beforeType} → ${filtered.length} places`);
    }

    // Rating filter
    if (filters.rating) {
      const beforeRating = filtered.length;
      filtered = filtered.filter(
        (place) => place.avg_rating && place.avg_rating >= filters.rating!
      );
      console.log(`🔍 Rating filtered: ${beforeRating} → ${filtered.length} places`);
    }

    // Women's area filter
    if (filters.womenArea) {
      const beforeWomen = filtered.length;
      filtered = filtered.filter(
        (place) => place.amenities?.women_area === true
      );
      console.log(`🔍 Women area filtered: ${beforeWomen} → ${filtered.length} places`);
    }

    // Capacity filter
    if (filters.capacity) {
      const beforeCapacity = filtered.length;
      filtered = filtered.filter(
        (place) => place.capacity && place.capacity >= filters.capacity!
      );
      console.log(`🔍 Capacity filtered: ${beforeCapacity} → ${filtered.length} places`);
    }

    // Created time filter
    if (filters.createdTime) {
      const beforeTime = filtered.length;
      const now = new Date();

      switch (filters.createdTime) {
        case "hour":
          filtered = filtered.filter((place) => {
            if (!place.created_at) return false;
            const placeDate = new Date(place.created_at);
            const diffHours = Math.abs(
              (now.getTime() - placeDate.getTime()) / (1000 * 60 * 60)
            );
            return diffHours <= 1;
          });
          break;
        case "day":
          filtered = filtered.filter((place) => {
            if (!place.created_at) return false;
            const placeDate = new Date(place.created_at);
            const diffDays = Math.abs(
              Math.ceil(
                (now.getTime() - placeDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
            return diffDays <= 1;
          });
          break;
        case "week":
          filtered = filtered.filter((place) => {
            if (!place.created_at) return false;
            const placeDate = new Date(place.created_at);
            const diffDays = Math.abs(
              Math.ceil(
                (now.getTime() - placeDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
            return diffDays <= 7;
          });
          break;
        case "month":
          filtered = filtered.filter((place) => {
            if (!place.created_at) return false;
            const placeDate = new Date(place.created_at);
            const diffDays = Math.abs(
              Math.ceil(
                (now.getTime() - placeDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
            return diffDays <= 30;
          });
          break;
      }
      console.log(`🔍 Time filtered: ${beforeTime} → ${filtered.length} places`);
    }

    console.log(`✅ Final filtered result: ${filtered.length} places`);
    setPlaces(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userLocation) {
      fetchNearbyPlaces(true); // Force refresh when user pulls to refresh
    } else {
      initializeLocation();
    }
  };

  // Memoized header component to prevent re-renders
  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Debug info and refresh button */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Showing {places.length} of {allPlaces.length} places
        </Text>
        <View style={styles.debugButtons}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              console.log('🔄 Manual refresh triggered');
              setHasLoadedData(false); // Reset to allow fresh data load
              fetchNearbyPlaces(true);
            }}
          >
            <MaterialIcons name="refresh" size={rf(20)} color={COLORS.primary} />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [places.length, allPlaces.length]);

  // Memoized render function for PlaceCard to prevent unnecessary re-renders
  const renderPlaceCard = useCallback(({ item }: { item: Place }) => (
    <PlaceCard place={item} onPress={() => handlePlacePress(item)} />
  ), []);

  const handlePlacePress = useCallback((place: Place) => {
    navigation.navigate("PlaceDetail", { placeId: place.id });
  }, [navigation]);

  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);



  const handleApplyFilters = (appliedFilters: FilterOptions) => {
    setFilters(appliedFilters);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="location-on" size={rf(56)} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No prayer spaces found</Text>
      <Text style={styles.emptySubtitle}>
        {filters.radius 
          ? `No places found within ${filters.radius / 1000}km of your location.`
          : 'No places found in your area.'
        }
      </Text>
      <Text style={styles.emptyHint}>
        Tap "Add Place" below to add a prayer space in this area.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <MaterialIcons name="error" size={rf(56)} color={COLORS.error} />
      </View>
      <Text style={styles.errorTitle}>Unable to load places</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <MaterialIcons name="my-location" size={rf(56)} color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Finding your location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Fixed SearchBar outside of FlatList to prevent re-rendering */}
      <SearchBar
        value={searchText}
        onChangeText={handleSearchTextChange}
        onFilterPress={handleFilterPress}
      />

      {error && !places.length ? (
        renderErrorState()
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={renderPlaceCard}
          getItemLayout={(data, index) => ({
            length: 130, // Approximate height of PlaceCard
            offset: 130 * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />



    </View>
  );
};

const responsiveDimensions = getResponsiveDimensions();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIconContainer: {
    marginBottom: rs(16),
  },
  loadingText: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: rs(32),
  },
  emptyIconContainer: {
    marginBottom: rs(16),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: rs(8),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: rs(16),
  },
  emptyHint: {
    fontSize: rf(13),
    color: COLORS.textLight,
    textAlign: "center",
    fontStyle: "italic",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: rs(32),
  },
  errorIconContainer: {
    marginBottom: rs(16),
  },
  errorTitle: {
    fontSize: rf(18),
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: rs(8),
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: rs(24),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rs(24),
  },
  retryButtonText: {
    fontSize: rf(16),
    color: COLORS.surface,
    fontWeight: "600",
  },
  debugContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    backgroundColor: COLORS.background,
  },
  debugText: {
    fontSize: rf(12),
    color: COLORS.textSecondary,
    flex: 1,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: rs(6),
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  refreshText: {
    fontSize: rf(12),
    color: COLORS.primary,
    marginLeft: rs(4),
    fontWeight: '600',
  },
});
