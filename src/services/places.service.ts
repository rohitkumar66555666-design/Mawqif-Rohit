import { supabase } from './supabase';
import { Place, CreatePlaceInput, Location } from '../types';
import { LocationService } from './location.service';
import { CacheService } from './cache.service';

export class PlacesService {
  // Get nearby places within radius (in meters) - with PROACTIVE offline support
  static async getNearbyPlaces(
    userLocation: Location,
    radiusMeters: number = 2000
  ): Promise<Place[]> {
    try {
      console.log('🔍 Fetching nearby places with proactive caching...');
      
      // Try to fetch from online source first
      try {
        const { data, error } = await supabase
          .from('places')
          .select('*');

        if (!error && data) {
          console.log(`🌐 Online: Fetched ${data.length} places from Supabase`);
          
          // Calculate distances for ALL places (don't filter by radius here)
          const placesWithDistance = data
            .map((place) => {
              const distance = LocationService.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                place.latitude,
                place.longitude
              );

              return {
                ...place,
                distance,
              } as Place;
            })
            .sort((a, b) => a.distance! - b.distance!);

          console.log(`📊 Calculated distances for ${placesWithDistance.length} places`);
          console.log(`📍 Sample distances:`, placesWithDistance.slice(0, 5).map(p => `${p.title}: ${Math.round(p.distance!)}m`));

          // Cache all places for comprehensive offline support
          await CacheService.cachePlaces(placesWithDistance);
          await CacheService.cacheUserLocation(userLocation);
          
          console.log(`✅ Cached ${placesWithDistance.length} places for offline use`);

          // Apply radius filter AFTER logging (let HomeScreen handle filtering)
          const filteredPlaces = placesWithDistance.filter((place) => place.distance! <= radiusMeters);
          console.log(`🔍 Filtered to ${filteredPlaces.length} places within ${radiusMeters/1000}km`);

          return filteredPlaces;
        }
      } catch (onlineError) {
        console.log('🌐 Online fetch failed, trying offline cache...');
      }

      // If online fetch fails, try offline cache with enhanced fallback
      console.log('📱 Offline: Loading places from cache...');
      const cachedPlaces = await CacheService.getPlacesWithOfflineFallback(userLocation);
      
      if (cachedPlaces && cachedPlaces.length > 0) {
        console.log(`📱 Offline: Found ${cachedPlaces.length} cached places`);
        
        // Filter cached places by radius
        const filteredPlaces = cachedPlaces
          .filter((place) => place.distance! <= radiusMeters)
          .sort((a, b) => a.distance! - b.distance!);

        console.log(`📱 Offline: ${filteredPlaces.length} places within ${radiusMeters/1000}km`);
        return filteredPlaces;
      }

      console.log('❌ No places available (online or offline)');
      return [];
    } catch (error) {
      console.error('❌ Error in getNearbyPlaces:', error);
      
      // Last resort: try cached places
      const cachedPlaces = await CacheService.getCachedPlaces();
      if (cachedPlaces) {
        // Calculate distances for cached places
        const placesWithDistance = cachedPlaces.map((place) => {
          const distance = LocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            place.latitude,
            place.longitude
          );
          return { ...place, distance } as Place;
        }).sort((a, b) => a.distance! - b.distance!);
        
        return placesWithDistance;
      }
      return [];
    }
  }

  // Proactive cache initialization - call this immediately when user location is obtained
  static async initializeProactiveCache(userLocation: Location): Promise<Place[]> {
    try {
      console.log('🚀 Initializing proactive cache for immediate offline backup...');
      
      // Use the proactive caching method from CacheService
      const cachedPlaces = await CacheService.proactiveCacheNearbyPlaces(
        userLocation,
        async (location, radius) => {
          // Fetch places from Supabase for caching
          const { data, error } = await supabase
            .from('places')
            .select('*');

          if (error || !data) {
            throw new Error(`Supabase error: ${error?.message || 'No data'}`);
          }

          // Calculate distances and return places within radius
          const placesWithDistance = data
            .map((place) => {
              const distance = LocationService.calculateDistance(
                location.latitude,
                location.longitude,
                place.latitude,
                place.longitude
              );
              return { ...place, distance } as Place;
            })
            .filter((place) => place.distance! <= radius)
            .sort((a, b) => a.distance! - b.distance!);

          return placesWithDistance;
        }
      );

      console.log(`✅ Proactive cache initialized with ${cachedPlaces.length} places`);
      return cachedPlaces;
      
    } catch (error) {
      console.error('❌ Error initializing proactive cache:', error);
      return [];
    }
  }

  // Get single place by ID - with offline support
  static async getPlaceById(id: string): Promise<Place | null> {
    try {
      console.log(`🔍 Fetching place details for ID: ${id}`);
      
      // Try online first
      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          console.log('🌐 Online: Fetched place details from Supabase');
          
          // Cache the place details
          await CacheService.cachePlaceDetails(data as Place);
          
          return data as Place;
        }
      } catch (onlineError) {
        console.log('🌐 Online fetch failed, trying offline cache...');
      }

      // Try offline cache
      console.log('📱 Offline: Loading place details from cache...');
      const cachedPlace = await CacheService.getCachedPlaceDetails(id);
      
      if (cachedPlace) {
        console.log('📱 Offline: Found cached place details');
        return cachedPlace;
      }

      console.log('❌ Place not found (online or offline)');
      return null;
    } catch (error) {
      console.error('❌ Error in getPlaceById:', error);
      
      // Last resort: try cached place
      const cachedPlace = await CacheService.getCachedPlaceDetails(id);
      return cachedPlace;
    }
  }

  // Create new place
  static async createPlace(placeData: CreatePlaceInput): Promise<Place> {
    console.log('🏪 PlacesService.createPlace called with data:', placeData);
    
    try {
      console.log('🔗 Connecting to Supabase...');
      console.log('🔗 Supabase connection ready');
      
      const { data, error } = await supabase
        .from('places')
        .insert([placeData])
        .select()
        .single();

      console.log('📥 Supabase response - data:', data);
      console.log('📥 Supabase response - error:', error);

      if (error) {
        console.error('❌ Supabase error details:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from Supabase');
        throw new Error('No data returned from database');
      }

      console.log('✅ Place created successfully:', data);
      return data as Place;
    } catch (error) {
      console.error('❌ Error in createPlace:', error);
      console.error('❌ Error type:', typeof error);
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Get cached places for offline mode with distance calculation
  static async getCachedPlaces(userLocation?: Location): Promise<Place[]> {
    try {
      const cachedPlaces = await CacheService.getCachedPlaces();
      if (!cachedPlaces || cachedPlaces.length === 0) {
        return [];
      }

      // If user location is provided, calculate distances
      if (userLocation) {
        const placesWithDistance = cachedPlaces.map((place) => {
          const distance = LocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            place.latitude,
            place.longitude
          );
          return { ...place, distance } as Place;
        }).sort((a, b) => a.distance! - b.distance!);
        
        console.log(`📱 Calculated distances for ${placesWithDistance.length} cached places`);
        return placesWithDistance;
      }

      return cachedPlaces;
    } catch (error) {
      console.error('❌ Error getting cached places:', error);
      return [];
    }
  }

  // Cache places for offline mode
  static async cachePlaces(places: Place[]): Promise<void> {
    try {
      await CacheService.cachePlaces(places);
      console.log(`✅ Cached ${places.length} places for offline use`);
    } catch (error) {
      console.error('❌ Error caching places:', error);
    }
  }

  // Get offline address for a place
  static async getOfflineAddress(placeId: string): Promise<string | null> {
    try {
      return await CacheService.getOfflineAddress(placeId);
    } catch (error) {
      console.error('❌ Error getting offline address:', error);
      return null;
    }
  }

  // Check if app is in offline mode
  static async isOfflineMode(): Promise<boolean> {
    try {
      return await CacheService.isOfflineMode();
    } catch (error) {
      console.error('❌ Error checking offline mode:', error);
      return true; // Assume offline if check fails
    }
  }
}
