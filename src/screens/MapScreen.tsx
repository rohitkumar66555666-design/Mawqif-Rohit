import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { PlaceMarker } from '../components/PlaceMarker';


import { Place, Location } from "../types";
import { LocationService } from "../services/location.service";
import { PlacesService } from "../services/places.service";
import { OfflineDirectionsService } from "../services/offline-directions.service";
import { useTheme } from "../contexts/ThemeContext";
import { getResponsiveDimensions, rs, rf } from "../utils/responsive";

interface MapScreenProps {
  navigation: any;
}

interface PlaceWithDistance extends Place {
  distance: number;
  routeDistance?: string;
  routeDuration?: string;
}

const MAX_DISPLAY_RADIUS_KM = 5; // Show masajids within 5km

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithDistance | null>(
    null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [hasLoadedMapData, setHasLoadedMapData] = useState(false); // Track if map data is loaded
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeMap();
  }, []);



  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const initializeMap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request location permission
      const hasPermission = await LocationService.requestPermission();
      if (!hasPermission) {
        setError("Location permission is required to view the map");
        setLoading(false);
        return;
      }

      // Get current location
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);

      // 🚀 PROACTIVE CACHING: Start background caching immediately
      console.log('🚀 MapScreen: Starting proactive cache...');
      PlacesService.initializeProactiveCache(location).catch((cacheError) => {
        console.log('⚠️ MapScreen: Background proactive caching failed:', cacheError);
      });

      // First, try to load cached places immediately for faster map loading
      const cachedPlaces = await PlacesService.getCachedPlaces(location);
      if (cachedPlaces.length > 0) {
        console.log(`📱 MapScreen: Loading ${cachedPlaces.length} cached places immediately with distances`);
        
        // Filter cached places for map display (distances already calculated)
        const nearbyPlacesFromCache = cachedPlaces
          .filter((place) => place.distance! <= MAX_DISPLAY_RADIUS_KM)
          .sort((a, b) => a.distance! - b.distance!);

        setPlaces(nearbyPlacesFromCache as PlaceWithDistance[]);
        setHasLoadedMapData(true);
      }

      // Then fetch fresh data (this will also update cache)
      try {
        const allPlaces = await PlacesService.getNearbyPlaces(
          location,
          50000 // 50km radius for initial fetch
        );

        // Filter to only show masajids within MAX_DISPLAY_RADIUS_KM (5km)
        const nearbyPlaces = allPlaces
          .filter(
            (place) =>
              calculateDistance(
                location.latitude,
                location.longitude,
                place.latitude,
                place.longitude
              ) <= MAX_DISPLAY_RADIUS_KM
          )
          .map((place) => ({
            ...place,
            distance: calculateDistance(
              location.latitude,
              location.longitude,
              place.latitude,
              place.longitude
            ),
          }))
          .sort((a, b) => a.distance - b.distance);

        setPlaces(nearbyPlaces);
        setHasLoadedMapData(true);
        console.log(`✅ MapScreen: Updated with ${nearbyPlaces.length} fresh places`);
        
      } catch (fetchError) {
        console.log('⚠️ MapScreen: Fresh data fetch failed, preserving existing data');
        // Keep the existing places that were already loaded - don't reload cached data
        if (hasLoadedMapData && places.length > 0) {
          console.log(`📱 MapScreen: Preserving existing ${places.length} places on map`);
          setError("Connection lost. Showing current places.");
        }
      }

    } catch (err: any) {
      console.error("Error loading map:", err);
      
      // Only try cached fallback if we don't have existing data
      if (!hasLoadedMapData || places.length === 0) {
        try {
          const cachedPlaces = await PlacesService.getCachedPlaces(userLocation || undefined);
          if (cachedPlaces.length > 0) {
            console.log(`📱 MapScreen: Fallback to ${cachedPlaces.length} cached places with distances`);
            
            const nearbyPlacesFromCache = cachedPlaces
              .filter((place) => place.distance! <= MAX_DISPLAY_RADIUS_KM)
              .sort((a, b) => a.distance! - b.distance!);

            setPlaces(nearbyPlacesFromCache as PlaceWithDistance[]);
            setHasLoadedMapData(true);
            setError("Using cached data. Check your internet connection.");
          } else {
            setError("Unable to load map. Please try again.");
          }
        } catch (cacheError) {
          setError("Unable to load map. Please try again.");
        }
      } else {
        // We have existing data, preserve it
        console.log(`📱 MapScreen: Preserving existing ${places.length} places`);
        setError("Connection lost. Showing current places.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDirectionsRoute = async (
    origin: Location,
    destination: { latitude: number; longitude: number }
  ) => {
    setLoadingRoute(true);
    try {
      console.log("🧭 Getting directions with offline support...");
      console.log("📍 Origin:", origin.latitude, origin.longitude);
      console.log("🎯 Destination:", destination.latitude, destination.longitude);

      // Use OfflineDirectionsService which handles online/offline automatically
      const routePoints = await OfflineDirectionsService.getDirections(origin, destination);
      
      if (routePoints && routePoints.length > 0) {
        console.log("✅ Route found with", routePoints.length, "points");
        setRouteCoordinates(routePoints);
        
        // Calculate basic route info
        const distance = calculateDistance(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude
        );
        
        setSelectedPlace(prev => prev ? {
          ...prev,
          routeDistance: `${distance.toFixed(1)} km`,
          routeDuration: `${Math.round(distance * 12)} min walk`
        } : null);
        
        return routePoints;
      } else {
        console.log("❌ No route found");
        setRouteCoordinates([]);
        return [];
      }
    } catch (err: any) {
      console.error("💥 Error fetching directions:", err);
      setRouteCoordinates([]);
      return [];
    } finally {
      setLoadingRoute(false);
    }
  };





  const handleGetDirections = async (place: PlaceWithDistance) => {
    console.log("🎯 Getting directions to:", place.title);
    
    // Set as selected place to show on map with polyline
    setSelectedPlace(place);

    // Clear any existing route first
    setRouteCoordinates([]);

    // Fetch actual route from Google Directions API
    if (userLocation) {
      try {
        console.log("📍 User location:", userLocation);
        console.log("🏛️ Destination:", place.latitude, place.longitude);
        
        const routePoints = await getDirectionsRoute(userLocation, {
          latitude: place.latitude,
          longitude: place.longitude,
        });
        
        console.log("✅ Route fetched successfully with", routePoints.length, "points");
        
      } catch (error: any) {
        console.error("❌ Error getting directions:", error);
      }
    } else {
      console.log("❌ No user location available");
    }

    // Animate map to show both user and selected place
    if (mapRef.current && userLocation) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            {
              latitude: place.latitude,
              longitude: place.longitude,
            },
          ],
          {
            edgePadding: { top: 100, right: 80, bottom: 250, left: 80 },
            animated: true,
          }
        );
      }, 1000); // Increased delay to allow route to load first
    }
  };

  const clearRoute = () => {
    setSelectedPlace(null);
    setRouteCoordinates([]);
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }, 1000);
    }
  };

  const handleMarkerPress = (place: PlaceWithDistance) => {
    navigation.navigate("PlaceDetail", { placeId: place.id });
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Unable to Load Map</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={initializeMap}
          >
            <Text style={styles.directionsButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePlaceCardPress = (item: PlaceWithDistance) => {
    // Set as selected place
    setSelectedPlace(item);
    
    // Zoom/focus on the selected place
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.01, // Closer zoom level
        longitudeDelta: 0.01,
      }, 1000); // 1 second animation
    }
    
    // Get directions
    handleGetDirections(item);
  };

  const renderPlaceCard = ({ item }: { item: PlaceWithDistance }) => (
    <TouchableOpacity
      onPress={() => handlePlaceCardPress(item)}
      style={[
        styles.placeCard,
        selectedPlace?.id === item.id && styles.placeCardSelected,
      ]}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.cardImage as any} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <MaterialIcons name="location-on" size={rf(36)} color={colors.surface} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDistance}>
          {item.distance.toFixed(1)} km away
        </Text>
        <Text style={styles.cardCity} numberOfLines={1}>
          {item.city}
        </Text>
      </View>
      <View style={styles.cardArrow}>
        <Feather name="chevron-right" size={rf(28)} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rs(24),
    },
    map: {
      flex: 1,
    },

    /* Bottom List Container - Zomato Style */
    bottomListContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: rs(20),
      borderTopRightRadius: rs(20),
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: rs(-4) },
      shadowOpacity: 0.2,
      shadowRadius: rs(8),
      maxHeight: `${responsiveDimensions.bottomListHeight}%`,
    },
    directionPanel: {
      paddingHorizontal: rs(16),
      paddingVertical: rs(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary,
    },
    directionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    directionInfo: {
      flex: 1,
    },
    directionTitle: {
      fontSize: rf(11),
      color: colors.surface,
      opacity: 0.9,
      marginBottom: rs(2),
    },
    selectedPlaceName: {
      fontSize: rf(14),
      fontWeight: "700",
      color: colors.surface,
    },
    clearRouteButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: rs(15),
      width: rs(30),
      height: rs(30),
      justifyContent: "center",
      alignItems: "center",
      marginLeft: rs(12),
    },
    clearRouteText: {
      color: colors.surface,
      fontSize: rf(16),
      fontWeight: "bold",
    },
    loadingRoute: {
      flexDirection: "row",
      alignItems: "center",
    },
    loadingRouteText: {
      color: colors.surface,
      fontSize: rf(12),
      marginLeft: rs(8),
      opacity: 0.9,
    },
    myLocationButton: {
      position: "absolute",
      top: rs(20),
      right: rs(16),
      backgroundColor: colors.surface,
      borderRadius: rs(25),
      width: rs(50),
      height: rs(50),
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: rs(2) },
      shadowOpacity: 0.25,
      shadowRadius: rs(3.84),
    },

    routeInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: rs(4),
    },
    selectedPlaceDistance: {
      fontSize: rf(13),
      color: colors.surface,
      fontWeight: "600",
    },
    selectedPlaceDuration: {
      fontSize: rf(12),
      color: colors.surface,
      opacity: 0.9,
    },
    listContent: {
      paddingHorizontal: rs(12),
      paddingVertical: rs(8),
    },
    placeCard: {
      backgroundColor: colors.background,
      borderRadius: responsiveDimensions.cardBorderRadius,
      marginHorizontal: rs(8),
      width: responsiveDimensions.placeCardWidth,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rs(10),
      paddingHorizontal: responsiveDimensions.cardPadding,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: rs(3) },
      shadowOpacity: 0.2,
      shadowRadius: rs(4),
      borderWidth: 2,
      borderColor: "transparent",
    },
    placeCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    cardImage: {
      width: responsiveDimensions.cardImageSize,
      height: responsiveDimensions.cardImageSize,
      borderRadius: rs(10),
      marginRight: rs(14),
      backgroundColor: colors.primary,
    },
    cardImagePlaceholder: {
      width: responsiveDimensions.cardImageSize,
      height: responsiveDimensions.cardImageSize,
      borderRadius: rs(10),
      marginRight: rs(14),
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    cardContent: {
      flex: 1,
      justifyContent: "center",
      paddingRight: rs(8),
    },
    cardTitle: {
      fontSize: rf(15),
      fontWeight: "700",
      color: colors.text,
      marginBottom: rs(4),
      textAlign: "left",
    },
    cardDistance: {
      fontSize: rf(13),
      color: colors.primary,
      fontWeight: "600",
      marginBottom: rs(2),
      textAlign: "left",
    },
    cardCity: {
      fontSize: rf(11),
      color: colors.textSecondary,
      textAlign: "left",
    },
    cardArrow: {
      paddingHorizontal: rs(10),
      paddingVertical: rs(6),
      justifyContent: "center",
      alignItems: "center",
    },

    emptyList: {
      paddingVertical: rs(20),
      justifyContent: "center",
      alignItems: "center",
    },
    emptyListText: {
      fontSize: rf(13),
      color: colors.textSecondary,
    },
    loadingText: {
      fontSize: rf(14),
      color: colors.textSecondary,
      marginTop: rs(16),
    },
    errorTitle: {
      fontSize: rf(16),
      fontWeight: "700",
      color: colors.text,
      marginBottom: rs(8),
    },
    errorMessage: {
      fontSize: rf(14),
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: rs(20),
    },
    directionsButton: {
      backgroundColor: colors.primary,
      borderRadius: rs(8),
      paddingHorizontal: rs(14),
      paddingVertical: rs(10),
      justifyContent: "center",
      alignItems: "center",
    },
    directionsButtonText: {
      color: colors.surface,
      fontSize: rf(13),
      fontWeight: "700",
    },
    userLocationMarker: {
      width: responsiveDimensions.markerSize,
      height: responsiveDimensions.markerSize,
      borderRadius: responsiveDimensions.markerSize / 2,
      backgroundColor: "rgba(76, 175, 80, 0.2)",
      borderWidth: 2,
      borderColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    userLocationDot: {
      width: rs(16),
      height: rs(16),
      borderRadius: rs(8),
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      


      {userLocation ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
            onMapReady={() => console.log("Map loaded successfully")}
          >
            {/* Custom User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Your Location"
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </Marker>
            )}

            {/* Render minimal circular markers for each place */}
            {places.map((place) => (
              <PlaceMarker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                imageUri={place.photo}
                onPress={() => handleMarkerPress(place)}
              />
            ))}

            {/* Draw direction line when place is selected */}
            {selectedPlace && userLocation && routeCoordinates.length > 0 && (
              <>
                {/* Background line for better visibility */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#FFFFFF"
                  strokeWidth={4}
                  lineJoin="round"
                  lineCap="round"
                />
                {/* Main route line */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor={colors.primary}
                  strokeWidth={3}
                  lineJoin="round"
                  lineCap="round"
                />
              </>
            )}
          </MapView>

          {/* Custom My Location Button */}
          <TouchableOpacity 
            style={styles.myLocationButton}
            onPress={centerOnUser}
          >
            <MaterialIcons name="my-location" size={rf(28)} color={colors.primary} />
          </TouchableOpacity>





          {/* Zomato-style bottom list */}
          <View style={styles.bottomListContainer}>
            {selectedPlace && (
              <View style={styles.directionPanel}>
                <View style={styles.directionHeader}>
                  <View style={styles.directionInfo}>
                    <Text style={styles.directionTitle}>Directions to</Text>
                    <Text style={styles.selectedPlaceName}>
                      {selectedPlace.title}
                    </Text>
                    <View style={styles.routeInfo}>
                      {loadingRoute ? (
                        <View style={styles.loadingRoute}>
                          <ActivityIndicator size="small" color={colors.surface} />
                          <Text style={styles.loadingRouteText}>Getting directions...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.selectedPlaceDistance}>
                            {selectedPlace.routeDistance || `${selectedPlace.distance.toFixed(1)} km`}
                          </Text>
                          <Text style={styles.selectedPlaceDuration}>
                            {selectedPlace.routeDuration || `${Math.round(selectedPlace.distance * 12)} min walk`}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.clearRouteButton}
                    onPress={clearRoute}
                  >
                    <MaterialIcons name="close" size={rf(20)} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {places.length > 0 ? (
              <FlatList
                data={places}
                renderItem={renderPlaceCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                snapToInterval={responsiveDimensions.placeCardWidth + rs(16)}
                decelerationRate="fast"
                onScrollToIndexFailed={() => {}}
              />
            ) : (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No prayer spaces within 5km
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const responsiveDimensions = getResponsiveDimensions();

export default MapScreen;
