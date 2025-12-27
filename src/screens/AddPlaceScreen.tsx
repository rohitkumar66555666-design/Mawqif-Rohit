import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { CreatePlaceInput, Location } from "../types";
import { PlacesService } from "../services/places.service";
import { ImageUploadService } from "../services/image-upload.service";
import { LocationService } from "../services/location.service";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfileService, UserProfile } from "../services/user-profile.service";
import {
  validatePlaceTitle,
  validateCity,
  validateCapacity,
} from "../utils/validation";
import { PLACE_TYPES } from "../utils/constants";
import { rf, rs } from "../utils/responsive";
import { useAddPlaceAuth, useUserInfo } from "../lib/authHelper";

interface AddPlaceScreenProps {
  navigation: any;
}

export const AddPlaceScreen: React.FC<AddPlaceScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { requireAddPlaceAuth } = useAddPlaceAuth();
  const { user, isAuthenticated, getUserDisplayName } = useUserInfo();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [hostedPlaces, setHostedPlaces] = useState(0); // TODO: Connect to actual hosted places count
  
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    type: "masjid",
    city: "",
    capacity: "",
    contact_phone: "",
    whatsapp_number: "",
    amenities: {
      wuzu: false,
      washroom: false,
      women_area: false,
    },
  });
  const [location, setLocation] = useState<Location | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    }
    getCurrentLocation();
    setPhoto(null);
    console.log('🔄 AddPlaceScreen mounted - cleared photo state');
  }, [isAuthenticated, user]);

  const loadUserProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoadingProfile(true);
      const profile = await UserProfileService.getProfile(user.uid);
      setUserProfile(profile);
      // TODO: Load hosted places count
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
    } catch (error) {
      console.log("Location error (expected in browser):", error);
      // For browser testing, use default Mumbai coordinates
      setLocation({
        latitude: 19.076,
        longitude: 72.8777,
      });
    }
  };

  const renderHostHeader = () => {
    if (isAuthenticated && user) {
      const displayName = userProfile?.full_name || getUserDisplayName();
      const profileImageUrl = userProfile?.profile_image_url;
      
      return (
        <>
          {/* Header Bar */}
          <View style={[styles.headerBar, { backgroundColor: colors.primary }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={rf(24)} color="white" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: 'white' }]}>
              {t('addPlace') || 'Add Place'}
            </Text>
            <TouchableOpacity style={styles.menuButton}>
              <MaterialIcons name="menu" size={rf(24)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Host Profile Section */}
          <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageTouchable}>
                {profileImageUrl ? (
                  <Image 
                    source={{ uri: profileImageUrl }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="person" size={rf(40)} color="white" />
                  </View>
                )}
                
                <View style={[styles.hostBadge, { backgroundColor: '#FF9800' }]}>
                  <MaterialIcons name="home" size={rf(12)} color="white" />
                </View>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
                {t('hostSince') || 'Host since'} {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'December 23, 2025'}
              </Text>
              
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {t('activeHost') || 'ACTIVE HOST'}
                </Text>
              </View>
            </View>
          </View>

          {/* Host Stats Cards */}
          <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statItem}>
                <MaterialIcons name="location-on" size={rf(24)} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>{hostedPlaces}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('hostedPlaces') || 'Hosted Places'}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="add-location" size={rf(24)} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>+1</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('newPlace') || 'New Place'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.tab, !showAddForm ? styles.activeTab : {}, { backgroundColor: !showAddForm ? colors.primary : colors.surface }]}
              onPress={() => setShowAddForm(false)}
            >
              <MaterialIcons name="dashboard" size={rf(18)} color={!showAddForm ? "white" : colors.textSecondary} />
              <Text style={[styles.tabText, { color: !showAddForm ? "white" : colors.textSecondary }]}>
                {t('dashboard') || 'Dashboard'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, showAddForm ? styles.activeTab : {}, { backgroundColor: showAddForm ? colors.primary : colors.surface }]}
              onPress={() => setShowAddForm(true)}
            >
              <MaterialIcons name="add-location" size={rf(18)} color={showAddForm ? "white" : colors.textSecondary} />
              <Text style={[styles.tabText, { color: showAddForm ? "white" : colors.textSecondary }]}>
                {t('addPlace') || 'Add Place'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('MyPlaces')}
            >
              <MaterialIcons name="list" size={rf(18)} color={colors.textSecondary} />
              <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                {t('myPlaces') || 'My Places'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return (
      <>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={rf(24)} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            {t('addPlace') || 'Add Place'}
          </Text>
          <TouchableOpacity style={styles.menuButton}>
            <MaterialIcons name="menu" size={rf(24)} color="white" />
          </TouchableOpacity>
        </View>

        {/* Guest Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={styles.profileImageTouchable}
              onPress={() => navigation.navigate('Login')}
            >
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.textSecondary }]}>
                <MaterialIcons name="person" size={rf(40)} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {t('becomeHost') || 'Become a Host'}
            </Text>
            <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
              {t('shareYourSpace') || 'Share your prayer space with the community'}
            </Text>
            
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.loginButtonText, { color: 'white' }]}>
                {t('getStarted') || 'Get Started'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };
    try {
      if (details?.formatted_address) {
        const fullAddress = details.formatted_address;

        // Don't overwrite the title, just set the location
        setSelectedPlace(details);

        // Extract city from address components
        const addressComponents = details.address_components || [];
        let extractedCity = "";

        // Try to find city (locality), otherwise use administrative_area_level_1
        for (let component of addressComponents) {
          if (component.types.includes("locality")) {
            extractedCity = component.long_name;
            break;
          } else if (component.types.includes("administrative_area_level_1")) {
            extractedCity = component.long_name;
          }
        }

        // Auto-fill city field only
        if (extractedCity) {
          setFormData((prevState) => ({
            ...prevState,
            city: extractedCity,
          }));
        }

        console.log("✅ Place selected:", fullAddress);
        console.log("🏙️ City auto-filled:", extractedCity);
      }
    } catch (error) {
      console.error("Error handling place selection:", error);
    }
  };

  const clearPlaceSelection = () => {
    setFormData({
      ...formData,
      title: "",
      address: "",
      city: "",
    });
    setSelectedPlace(null);
    if (googlePlacesRef.current) {
      googlePlacesRef.current.setAddressText("");
    }
  };

  const pickImage = async () => {
    try {
      console.log('📷 BASIC: Starting image picker...');
      
      // Very basic permission request
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📷 BASIC: Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(t('error'), t('locationPermissionRequired'));
        return;
      }

      console.log('📷 BASIC: Opening gallery...');
      
      // Use the most compatible format for mediaTypes
      const mediaTypes = ImagePicker.MediaTypeOptions?.Images || 'Images';

      // Minimal image picker options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        quality: 0.8,
        base64: true,
      });

      console.log('📷 BASIC: Result received:', result.canceled ? 'Canceled' : 'Success');

      if (result.canceled) {
        console.log('📷 BASIC: User canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        console.log('📷 BASIC: Image data:', {
          hasUri: !!image.uri,
          hasBase64: !!image.base64,
          size: image.fileSize
        });
        
        if (image.uri && image.base64) {
          setPhoto(image.uri);
          (global as any).selectedImageData = {
            uri: image.uri,
            base64: image.base64
          };
          console.log('✅ BASIC: Image set successfully');
        } else {
          Alert.alert(t('error'), 'Image data incomplete. Try a different image.');
        }
      } else {
        Alert.alert(t('error'), 'No image selected.');
      }
        
    } catch (error) {
      console.error('❌ BASIC: Image picker error:', error);
      console.error('❌ BASIC: Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Image Picker Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validatePlaceTitle(formData.title);
    if (titleError) newErrors.title = titleError;

    // Add address validation
    if (!formData.address.trim()) {
      newErrors.address = t('addressRequired');
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "Please enter a complete address";
    }

    const cityError = validateCity(formData.city);
    if (cityError) newErrors.city = cityError;

    const capacityError = validateCapacity(formData.capacity);
    if (capacityError) newErrors.capacity = capacityError;

    if (!location) {
      newErrors.location = t('locationRequired');
    }

    // TODO: Uncomment when Google Places is enabled
    // if (!selectedPlace) {
    //   newErrors.location = "Please select a location from search results";
    // }

    // Photo is required for good user experience
    if (!photo) {
      newErrors.photo = t('photoRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Check authentication first
    const proceedWithSubmission = async () => {
      console.log("🚀 handleSubmit called");
      console.log("📍 Current location:", location);
      console.log("📝 Form data:", formData);

      const isValid = validateForm();
      console.log("✅ Form validation result:", isValid);
      console.log("❌ Validation errors:", errors);

      if (!isValid) {
        console.log("❌ Form validation failed, stopping submission");
        return;
      }

      if (!location) {
        console.log("❌ No location available, stopping submission");
        return;
      }

      console.log("🔄 Starting submission process...");
      setLoading(true);

      try {
        // Create place data with all required fields
        const placeData: CreatePlaceInput = {
          title: formData.title.trim(),
          address: formData.address.trim(), // Add address field
          type: formData.type,
          latitude: location.latitude,
          longitude: location.longitude,
          city: formData.city.trim(),
          amenities: formData.amenities, // Include amenities (optional with default in DB)
        };

        // Helper to proceed with creating the place (used when user chooses to continue without image)
        const proceedWithPlaceCreation = async () => {
          try {
            const result = await PlacesService.createPlace(placeData);
            console.log("✅ Place created successfully:", result);
            console.log("🔍 Created place photo field:", result.photo || 'undefined - NO IMAGE SAVED');

            Alert.alert(t('success'), t('placeAddedSuccess'), [
              {
                text: t('viewPlaces'),
                onPress: () => {
                  // Reset form completely
                  console.log('🔄 Resetting form after successful submission...');
                  setFormData({
                    title: "",
                    address: "",
                    type: "masjid",
                    city: "",
                    capacity: "",
                    contact_phone: "",
                    whatsapp_number: "",
                    amenities: {
                      wuzu: false,
                      washroom: false,
                      women_area: false,
                    },
                  });
                  setPhoto(null); // Clear photo state
                  setErrors({}); // Clear any errors
                  console.log('✅ Form reset completed');

                  // Navigate to home tab
                  navigation.navigate("HomeTab");
                },
              },
            ]);
          } catch (error) {
            console.error("❌ Error creating place:", error);
            const errorMessage = error instanceof Error ? error.message : t('error');
            Alert.alert(t('error'), `Unable to add place: ${errorMessage}`);
          } finally {
            setLoading(false);
            console.log("🏁 Submission process completed");
          }
        };

        // Add optional fields only if they have values
        if (formData.capacity && formData.capacity.trim()) {
          placeData.capacity = parseInt(formData.capacity);
        }

        // Add contact information if provided
        if (formData.contact_phone && formData.contact_phone.trim()) {
          placeData.contact_phone = formData.contact_phone.trim();
        }

        if (formData.whatsapp_number && formData.whatsapp_number.trim()) {
          placeData.whatsapp_number = formData.whatsapp_number.trim();
        }

        console.log("📤 Sending place data to Supabase:", placeData);

        // Upload image to Supabase Storage if photo exists
        if (photo) {
          console.log('📤 Uploading image to cloud storage...');
          console.log('📱 Local image URI:', photo);
          
          try {
            const publicImageUrl = await ImageUploadService.uploadPlaceImage(photo);
            
            // Validate that we got a proper Supabase URL
            if (publicImageUrl && publicImageUrl.includes('supabase.co') && publicImageUrl.includes('/public/')) {
              placeData.photo = publicImageUrl; // Use public URL instead of local URI
              console.log('✅ Image uploaded successfully:', publicImageUrl);
            } else {
              console.error('❌ Invalid image URL returned:', publicImageUrl);
              throw new Error('Invalid image URL format');
            }
          } catch (imageError) {
            console.error('❌ Image upload failed:', imageError);
            
            // Show alert with options
            Alert.alert(
              "Image Upload Failed", 
              `Error: ${imageError instanceof Error ? imageError.message : 'Unknown error'}\n\nPlease try:\n• Selecting a different image\n• Using a smaller image file\n• Checking your internet connection`,
              [
                { 
                  text: t('tryAgain'), 
                  style: "default",
                  onPress: () => {
                    // Don't continue - let user try again
                    console.log('❌ User will try uploading again');
                  }
                },
                { 
                  text: "Continue Without Image", 
                  style: "destructive",
                  onPress: async () => {
                    const confirmContinue = await new Promise<boolean>((resolve) => {
                      Alert.alert(
                        "Are you sure?",
                        "Places without photos get less visibility. Users prefer to see what the place looks like.",
                        [
                          { text: t('cancel'), onPress: () => resolve(false) },
                          { text: "Continue Anyway", onPress: () => resolve(true) }
                        ]
                      );
                    });
                    
                    if (confirmContinue) {
                      // Continue without image
                      console.log('⚠️ User chose to continue without image');
                      // Don't set placeData.photo at all
                      proceedWithPlaceCreation();
                    }
                  }
                }
              ]
            );
            
            return; // Exit early - don't continue with place creation
          }
        } else {
          console.log('📷 No photo selected - creating place without image');
        }

        await proceedWithPlaceCreation();
      } catch (error) {
        console.error("❌ Error creating place:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        const errorMessage =
          error instanceof Error ? error.message : t('error');
        Alert.alert(t('error'), `Unable to add place: ${errorMessage}`);
      } finally {
        setLoading(false);
        console.log("🏁 Submission process completed");
      }
    };

    // Require authentication for adding a place
    requireAddPlaceAuth(navigation, proceedWithSubmission);
  };

  const renderTypeSelector = () => (
    <View style={styles.typeContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{t('typeOfPlace')} *</Text>
      <View style={styles.typeButtons}>
        {PLACE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              formData.type === type.value && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFormData({ ...formData, type: type.value })}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: colors.text },
                formData.type === type.value && { color: colors.textInverse },
              ]}
            >
              {t(type.value)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAmenities = () => (
    <View style={styles.amenitiesContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{t('availableAmenities')}</Text>
      {Object.entries(formData.amenities).map(([key, value]) => (
        <TouchableOpacity
          key={key}
          style={styles.amenityRow}
          onPress={() =>
            setFormData({
              ...formData,
              amenities: {
                ...formData.amenities,
                [key]: !value,
              },
            })
          }
        >
          <View style={[
            styles.checkbox, 
            { borderColor: colors.border, backgroundColor: colors.surface },
            value && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}>
            {value && <MaterialIcons name="check" size={rf(20)} color={colors.textInverse} />}
          </View>
          <Text style={[styles.amenityLabel, { color: colors.text }]}>
            {t(key)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('helpFellowMuslims')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('placeName')} *</Text>
            <View style={styles.placeNameWrapper}>
              {/* TODO: Uncomment when Google API is ready */}
              {/* 
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder="Enter place name (e.g., Al-Noor Masjid, Mumbai)"
                onPress={(data, details) => {
                  console.log("✅ Place selected:", data, details);
                  handlePlaceSelect(data, details);
                }}
                onFail={(error) => {
                  console.error("❌ Google Places API Error:", error);
                  Alert.alert("API Error", "Google Places search failed. Please check your internet connection.");
                }}
                onNotFound={() => {
                  console.log("⚠️ No places found");
                }}
                query={{
                  key: "AIzaSyAW9rqfI9yHaXgxMMUB5tzSoZqkaNKWUNs",
                  language: "en",
                  components: "country:in",
                  types: "establishment|geocode",
                }}
                styles={{
                  textInput: styles.googlePlacesInput,
                  container: styles.googlePlacesContainer,
                  listView: styles.googlePlacesListView,
                  row: styles.googlePlacesRow,
                  description: styles.googlePlacesDescription,
                }}
                textInputProps={{
                  placeholderTextColor: colors.textSecondary,
                  onFocus: () => console.log("🔍 Google Places input focused"),
                  onChangeText: (text) => console.log("📝 Typing:", text),
                }}
                currentLocation={false}
                currentLocationLabel="Current location"
                debounce={300}
                minLength={2}
                fetchDetails={true}
                enablePoweredByContainer={false}
                isRowScrollable={false}
                requestUrl={{
                  useOnPlatform: 'web',
                }}
              />
              */}
              
              {/* Temporary simple input - will be replaced with Google Places later */}
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, errors.title && { borderColor: colors.error }]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder={t('enterPlaceName')}
                placeholderTextColor={colors.textSecondary}
              />
              
              {selectedPlace && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearPlaceSelection}
                >
                  <MaterialIcons name="close" size={rf(22)} color={colors.surface} />
                </TouchableOpacity>
              )}
            </View>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('address')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, errors.address && { borderColor: colors.error }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder={t('enterFullAddress')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />
            {errors.address && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.address}</Text>
            )}
          </View>

          {renderTypeSelector()}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('city')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, errors.city && { borderColor: colors.error }]}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder={t('enterCity')}
              placeholderTextColor={colors.textSecondary}
            />
            {errors.city && <Text style={[styles.errorText, { color: colors.error }]}>{errors.city}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('capacityOptional')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, errors.capacity && { borderColor: colors.error }]}
              value={formData.capacity}
              onChangeText={(text) =>
                setFormData({ ...formData, capacity: text })
              }
              placeholder={t('enterCapacity')}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.capacity && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.capacity}</Text>
            )}
          </View>

          {/* Contact Information Section */}
          <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contactInformation')}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('phoneNumber')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.contact_phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact_phone: text })
                }
                placeholder={t('enterPhone')}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('whatsappNumber')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.whatsapp_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, whatsapp_number: text })
                }
                placeholder={t('enterPhone')}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {renderAmenities()}

          <View style={styles.photoContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('photo')} *</Text>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              {photo ? (
                <View style={styles.photoPreviewContainer}>
                  <Image 
                    key={photo} // Force re-render when photo changes
                    source={{ uri: photo }} 
                    style={styles.photoPreview}
                    onError={(error) => {
                      console.error('❌ Photo preview error:', error.nativeEvent.error);
                      console.error('❌ Failed photo URI:', photo);
                    }}
                    onLoad={() => {
                      console.log('✅ Photo preview loaded successfully for:', photo);
                    }}
                    onLoadStart={() => {
                      console.log('🔄 Starting to load photo preview:', photo);
                    }}
                  />
                  <TouchableOpacity 
                    style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                    onPress={() => {
                      setPhoto(null);
                      console.log('📷 Photo removed - cleared state');
                    }}
                  >
                    <MaterialIcons name="close" size={rf(20)} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="camera-alt" size={rf(40)} color={colors.textSecondary} />
                  <Text style={[styles.photoPlaceholderText, { color: colors.textSecondary }]}>{t('addPhoto')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {!photo && (
              <Text style={[styles.errorText, { color: colors.error }]}>{t('photoRequired')}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              loading && { backgroundColor: colors.textSecondary },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
              {loading ? t('addingPlace') : t('addPrayerSpace')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const responsiveDimensions = getResponsiveDimensions();

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: rs(16),
  },
  description: {
    fontSize: rf(16),
    textAlign: "center",
    marginBottom: rs(24),
  },
  inputContainer: {
    marginBottom: rs(20),
  },
  sectionContainer: {
    marginBottom: rs(24),
    padding: rs(16),
    borderRadius: rs(12),
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    marginBottom: rs(16),
  },
  label: {
    fontSize: rf(16),
    fontWeight: "600",
    marginBottom: rs(8),
  },
  input: {
    borderWidth: 2,
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: responsiveDimensions.inputPadding,
    fontSize: rf(16),
    minHeight: responsiveDimensions.inputHeight,
  },
  inputError: {
    borderWidth: 2,
  },
  errorText: {
    fontSize: rf(14),
    marginTop: rs(4),
  },
  typeContainer: {
    marginBottom: rs(20),
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  typeButton: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    borderWidth: 1,
  },
  typeButtonActive: {
  },
  typeButtonText: {
    fontSize: rf(14),
  },
  typeButtonTextActive: {
  },
  amenitiesContainer: {
    marginBottom: rs(20),
  },
  amenityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs(8),
  },
  checkbox: {
    width: rs(24),
    height: rs(24),
    borderWidth: 2,
    borderRadius: rs(4),
    marginRight: rs(12),
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
  },

  amenityLabel: {
    fontSize: rf(16),
  },
  photoContainer: {
    marginBottom: rs(20),
  },
  photoButton: {
    height: rs(120),
    borderRadius: rs(8),
    overflow: "hidden",
  },
  photoPreviewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removePhotoButton: {
    position: "absolute",
    top: rs(8),
    right: rs(8),
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(3),
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
    fontSize: rf(16),
    marginTop: rs(8),
  },
  locationContainer: {
    marginBottom: rs(24),
  },
  locationText: {
    fontSize: rf(14),
    padding: rs(12),
    borderRadius: rs(8),
  },
  locationButton: {
    padding: rs(12),
    borderRadius: rs(8),
    alignItems: "center",
    borderWidth: 1,
  },
  locationButtonText: {
    fontSize: rf(16),
  },
  submitButton: {
    paddingVertical: rs(18),
    borderRadius: responsiveDimensions.cardBorderRadius,
    alignItems: "center",
    elevation: 6,
    minHeight: responsiveDimensions.buttonHeight,
  },
  submitButtonDisabled: {
  },
  submitButtonText: {
    fontSize: rf(18),
    fontWeight: "600",
  },
  placeNameWrapper: {
    position: "relative",
  },
  googlePlacesContainer: {
    flex: 0,
    position: "relative",
    zIndex: 10,
  },
  googlePlacesInput: {
    borderWidth: 2,
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: responsiveDimensions.inputPadding,
    fontSize: rf(16),
    paddingRight: rs(50), // Space for clear button
    minHeight: responsiveDimensions.inputHeight,
  },
  googlePlacesListView: {
    borderWidth: 1,
    borderRadius: rs(8),
    marginTop: rs(4),
    maxHeight: rs(300),
    elevation: 10,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.25,
    shadowRadius: rs(5),
    zIndex: 100,
  },
  googlePlacesRow: {
    padding: rs(12),
    borderBottomWidth: 1,
  },
  googlePlacesDescription: {
    fontSize: rf(14),
  },
  clearButton: {
    position: "absolute",
    right: rs(12),
    top: rs(16),
    width: rs(24),
    height: rs(24),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: rs(12),
    zIndex: 15,
  },

});
