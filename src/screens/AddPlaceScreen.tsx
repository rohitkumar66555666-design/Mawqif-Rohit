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
  FlatList,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
// TODO: Uncomment when Google API is ready
// import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { CreatePlaceInput, Location } from "../types";
import { PlacesService } from "../services/places.service";
import { ImageUploadService } from "../services/image-upload.service";
import { LocationService } from "../services/location.service";
import {
  validatePlaceTitle,
  validateCity,
  validateCapacity,
} from "../utils/validation";
import { COLORS, PLACE_TYPES } from "../utils/constants";
import { getResponsiveDimensions, rs, rf } from "../utils/responsive";

interface AddPlaceScreenProps {
  navigation: any;
}

export const AddPlaceScreen: React.FC<AddPlaceScreenProps> = ({
  navigation,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    address: "", // Add address field
    type: "masjid",
    city: "",
    capacity: "",
    contact_phone: "", // Add contact phone field
    whatsapp_number: "", // Add WhatsApp field
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
  const googlePlacesRef = useRef<any>(null);

  useEffect(() => {
    getCurrentLocation();
    // Clear any cached photo state on component mount
    setPhoto(null);
    console.log('🔄 AddPlaceScreen mounted - cleared photo state');
  }, []);

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

  const handlePlaceSelect = (data: any, details: any) => {
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
        Alert.alert('Permission Needed', 'Please allow photo access to upload images.');
        return;
      }

      console.log('📷 BASIC: Opening gallery...');
      
      // Minimal image picker options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fixed: use MediaTypeOptions
        quality: 0.8,
        base64: true,
      });

      console.log('📷 BASIC: Result received:', result.canceled ? 'Canceled' : 'Success');

      if (result.canceled) {
        console.log('📷 BASIC: User canceled');
        return;
      }

      if (result.assets && result.assets[0]) {
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
          Alert.alert('Error', 'Image data incomplete. Try a different image.');
        }
      } else {
        Alert.alert('Error', 'No image selected.');
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
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "Please enter a complete address";
    }

    const cityError = validateCity(formData.city);
    if (cityError) newErrors.city = cityError;

    const capacityError = validateCapacity(formData.capacity);
    if (capacityError) newErrors.capacity = capacityError;

    if (!location) {
      newErrors.location = "Location is required";
    }

    // TODO: Uncomment when Google Places is enabled
    // if (!selectedPlace) {
    //   newErrors.location = "Please select a location from search results";
    // }

    // Photo is required for good user experience
    if (!photo) {
      newErrors.photo = "Photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
                text: "Try Again", 
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
                        { text: "Cancel", onPress: () => resolve(false) },
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

      const result = await PlacesService.createPlace(placeData);
      console.log("✅ Place created successfully:", result);
      console.log("🔍 Created place photo field:", result.photo || 'undefined - NO IMAGE SAVED');

      Alert.alert("Success", "Prayer space added successfully!", [
        {
          text: "View Places",
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
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Unable to add place: ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log("🏁 Submission process completed");
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.typeContainer}>
      <Text style={styles.label}>Type of Place *</Text>
      <View style={styles.typeButtons}>
        {PLACE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeButton,
              formData.type === type.value && styles.typeButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, type: type.value })}
          >
            <Text
              style={[
                styles.typeButtonText,
                formData.type === type.value && styles.typeButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAmenities = () => (
    <View style={styles.amenitiesContainer}>
      <Text style={styles.label}>Available Amenities</Text>
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
          <View style={[styles.checkbox, value && styles.checkboxActive]}>
            {value && <MaterialIcons name="check" size={rf(20)} color={COLORS.surface} />}
          </View>
          <Text style={styles.amenityLabel}>
            {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Help fellow Muslims by adding a prayer space in your area.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Place Name *</Text>
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
                  placeholderTextColor: COLORS.textSecondary,
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
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter place name (e.g., Al-Noor Masjid)"
                placeholderTextColor={COLORS.textSecondary}
              />
              
              {selectedPlace && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearPlaceSelection}
                >
                  <MaterialIcons name="close" size={rf(22)} color={COLORS.surface} />
                </TouchableOpacity>
              )}
            </View>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter full address (e.g., 123 Main Street, Andheri West)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={2}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {renderTypeSelector()}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="e.g., Mumbai, Delhi"
              placeholderTextColor={COLORS.textSecondary}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Capacity (Optional)</Text>
            <TextInput
              style={[styles.input, errors.capacity && styles.inputError]}
              value={formData.capacity}
              onChangeText={(text) =>
                setFormData({ ...formData, capacity: text })
              }
              placeholder="e.g., 50"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
            {errors.capacity && (
              <Text style={styles.errorText}>{errors.capacity}</Text>
            )}
          </View>

          {/* Contact Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.contact_phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact_phone: text })
                }
                placeholder="e.g., +91 9876543210"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput
                style={styles.input}
                value={formData.whatsapp_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, whatsapp_number: text })
                }
                placeholder="e.g., +91 9876543210"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {renderAmenities()}

          <View style={styles.photoContainer}>
            <Text style={styles.label}>Photo *</Text>
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
                    style={styles.removePhotoButton}
                    onPress={() => {
                      setPhoto(null);
                      console.log('📷 Photo removed - cleared state');
                    }}
                  >
                    <MaterialIcons name="close" size={rf(20)} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="camera-alt" size={rf(40)} color={COLORS.textSecondary} />
                  <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {!photo && (
              <Text style={styles.errorText}>Photo is required</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Adding Place..." : "Add Prayer Space"}
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
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: rs(16),
  },
  description: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: rs(24),
  },
  inputContainer: {
    marginBottom: rs(20),
  },
  sectionContainer: {
    marginBottom: rs(24),
    padding: rs(16),
    backgroundColor: COLORS.surface,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: rs(16),
  },
  label: {
    fontSize: rf(16),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: rs(8),
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: responsiveDimensions.inputPadding,
    fontSize: rf(16),
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    minHeight: responsiveDimensions.inputHeight,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: rf(14),
    color: COLORS.error,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: rf(14),
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: COLORS.surface,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: rs(4),
    marginRight: rs(12),
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  amenityLabel: {
    fontSize: rf(16),
    color: COLORS.text,
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
    backgroundColor: COLORS.error,
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
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.background,
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    marginTop: rs(8),
  },
  locationContainer: {
    marginBottom: rs(24),
  },
  locationText: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    padding: rs(12),
    borderRadius: rs(8),
  },
  locationButton: {
    backgroundColor: COLORS.surface,
    padding: rs(12),
    borderRadius: rs(8),
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  locationButtonText: {
    fontSize: rf(16),
    color: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: rs(18),
    borderRadius: responsiveDimensions.cardBorderRadius,
    alignItems: "center",
    elevation: 6,
    minHeight: responsiveDimensions.buttonHeight,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: rf(18),
    fontWeight: "600",
    color: COLORS.surface,
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
    borderColor: COLORS.border,
    borderRadius: responsiveDimensions.cardBorderRadius,
    padding: responsiveDimensions.inputPadding,
    fontSize: rf(16),
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingRight: rs(50), // Space for clear button
    minHeight: responsiveDimensions.inputHeight,
  },
  googlePlacesListView: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: rs(8),
    marginTop: rs(4),
    backgroundColor: COLORS.surface,
    maxHeight: rs(300),
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.25,
    shadowRadius: rs(5),
    zIndex: 100,
  },
  googlePlacesRow: {
    padding: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  googlePlacesDescription: {
    fontSize: rf(14),
    color: COLORS.text,
  },
  clearButton: {
    position: "absolute",
    right: rs(12),
    top: rs(16),
    width: rs(24),
    height: rs(24),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.error,
    borderRadius: rs(12),
    zIndex: 15,
  },

});
