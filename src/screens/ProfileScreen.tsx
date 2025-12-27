import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuthStore } from '../lib/authStore';
import { useUserInfo } from '../lib/authHelper';
import { ImageUploadService } from '../services/image-upload.service';
import { UserProfileService, UserProfile } from '../services/user-profile.service';
import { rf, rs } from '../utils/responsive';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { logout } = useAuthStore();
  const { user, isAuthenticated, getUserDisplayName, getUserPhone, isVerifiedUser } = useUserInfo();
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    city: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load user profile on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isAuthenticated, user]);

  const loadUserProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoadingProfile(true);
      console.log('👤 Loading profile for user:', user.uid);
      
      const profile = await UserProfileService.getProfile(user.uid);
      
      if (profile) {
        setUserProfile(profile);
        console.log('✅ Profile loaded:', profile);
      } else {
        console.log('ℹ️ No profile found, user needs to complete profile');
        // Check if we should create a basic profile
        await createBasicProfile();
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const createBasicProfile = async () => {
    if (!user?.uid || !user?.phoneNumber) return;
    
    try {
      console.log('👤 Creating basic profile for new user');
      
      const basicProfile = await UserProfileService.createProfile({
        user_id: user.uid,
        phone_number: user.phoneNumber,
        first_name: user.displayName || undefined,
      });
      
      setUserProfile(basicProfile);
      console.log('✅ Basic profile created:', basicProfile);
    } catch (error) {
      console.error('❌ Error creating basic profile:', error);
    }
  };

  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;
    
    let completedFields = 0;
    const totalFields = 6; // first_name, last_name, date_of_birth, gender, city, profile_image
    
    if (userProfile.first_name) completedFields++;
    if (userProfile.last_name) completedFields++;
    if (userProfile.date_of_birth) completedFields++;
    if (userProfile.gender) completedFields++;
    if (userProfile.city) completedFields++;
    if (userProfile.profile_image_url) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  const handleEditProfile = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    // Pre-fill form with current profile data
    setEditForm({
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      date_of_birth: userProfile?.date_of_birth || '',
      gender: userProfile?.gender || '',
      city: userProfile?.city || '',
    });
    
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoadingProfile(true);
      
      const updatedProfile = await UserProfileService.updateProfile(user.uid, {
        first_name: editForm.first_name.trim() || undefined,
        last_name: editForm.last_name.trim() || undefined,
        date_of_birth: editForm.date_of_birth || undefined,
        gender: editForm.gender || undefined,
        city: editForm.city.trim() || undefined,
      });
      
      setUserProfile(updatedProfile);
      setShowEditModal(false);
      Alert.alert(t('success'), t('profileUpdated'));
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert(t('error'), t('failedToUploadImage'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const today = new Date();
      
      // Prevent selecting future dates
      if (selectedDate > today) {
        Alert.alert(t('error'), t('invalidBirthDate'));
        return;
      }
      
      // Prevent selecting dates too far in the past (more than 120 years ago)
      const maxPastDate = new Date();
      maxPastDate.setFullYear(today.getFullYear() - 120);
      
      if (selectedDate < maxPastDate) {
        Alert.alert(t('error'), t('birthDateTooOld'));
        return;
      }
      
      setSelectedDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      setEditForm(prev => ({ ...prev, date_of_birth: dateString }));
    }
  };

  // Profile menu items
  const profileMenuItems = [
    {
      id: 'my-reviews',
      title: t('myReviews'),
      subtitle: t('reviewsYouWrote'),
      icon: 'rate-review',
      onPress: () => handleMyReviews(),
      requiresAuth: true,
    },
    {
      id: 'bookmarks',
      title: t('bookmarks'),
      subtitle: t('yourSavedPlaces'),
      icon: 'bookmark',
      onPress: () => handleBookmarks(),
      requiresAuth: true,
    },
    {
      id: 'cache',
      title: t('offlineCache'),
      subtitle: t('manageOfflineData'),
      icon: 'storage',
      onPress: () => navigation.navigate('CacheManagement'),
      requiresAuth: false,
    },
  ];

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            Alert.alert(t('success'), t('loggedOutSuccessfully'));
          },
        },
      ]
    );
  };

  const handleMyReviews = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    navigation.navigate('MyReviews');
  };

  const handleBookmarks = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    navigation.navigate('Bookmarks');
  };

  const handleProfileImagePress = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    Alert.alert(
      t('selectImage'),
      t('chooseProfileImageSource'),
      [
        {
          text: t('camera'),
          onPress: () => pickImageFromCamera(),
        },
        {
          text: t('gallery'),
          onPress: () => pickImageFromGallery(),
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('cameraPermissionRequired'));
        return;
      }

      // Use the most compatible format for mediaTypes
      const mediaTypes = ImagePicker.MediaTypeOptions?.Images || 'Images';

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('📷 Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), t('failedToOpenCamera'));
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('galleryPermissionRequired'));
        return;
      }

      // Use the most compatible format for mediaTypes
      const mediaTypes = ImagePicker.MediaTypeOptions?.Images || 'Images';

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('🖼️ Gallery result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(t('error'), t('failedToOpenGallery'));
    }
  };

  const uploadProfileImage = async (imageAsset: any) => {
    if (!user?.uid) return;
    
    try {
      setUploadingImage(true);
      
      // Store base64 data globally for the upload service to use
      (global as any).selectedImageData = {
        base64: imageAsset.base64,
        uri: imageAsset.uri
      };
      
      // Upload image to Supabase Storage
      const publicImageUrl = await ImageUploadService.uploadProfileImage(imageAsset.uri, user.uid);
      
      if (publicImageUrl && publicImageUrl.includes('supabase.co')) {
        // Update profile in database
        const updatedProfile = await UserProfileService.updateProfileImage(user.uid, publicImageUrl);
        setUserProfile(updatedProfile);
        Alert.alert(t('success'), t('profileImageUpdated'));
      } else {
        throw new Error('Invalid image URL returned');
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      Alert.alert(t('error'), t('failedToUploadImage'));
    } finally {
      setUploadingImage(false);
      // Clean up stored data
      delete (global as any).selectedImageData;
    }
  };

  const renderProfileHeader = () => {
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
              {t('profile') || 'Profile'}
            </Text>
            <TouchableOpacity style={styles.menuButton}>
              <MaterialIcons name="menu" size={rf(24)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Profile Info Section */}
          <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity
                style={styles.profileImageTouchable}
                onPress={handleProfileImagePress}
                disabled={uploadingImage}
              >
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
                
                <View style={[styles.editImageOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                  {uploadingImage ? (
                    <MaterialIcons name="hourglass-empty" size={rf(12)} color="white" />
                  ) : (
                    <MaterialIcons name="edit" size={rf(12)} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
                {t('memberSince') || 'Member since'} {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'December 23, 2025'}
              </Text>
              
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {t('active') || 'ACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statItem}>
                <MaterialIcons name="bookmark" size={rf(24)} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('bookmarks') || 'Bookmarks'}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={rf(24)} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('reviews') || 'Reviews'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity style={[styles.tab, styles.activeTab, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="person" size={rf(18)} color="white" />
              <Text style={[styles.tabText, { color: 'white' }]}>
                {t('info') || 'Info'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Bookmarks')}
            >
              <MaterialIcons name="bookmark" size={rf(18)} color={colors.textSecondary} />
              <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                {t('bookmarks') || 'Bookmarks'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('MyReviews')}
            >
              <MaterialIcons name="star" size={rf(18)} color={colors.textSecondary} />
              <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                {t('reviews') || 'Reviews'}
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
            {t('profile') || 'Profile'}
          </Text>
          <TouchableOpacity style={styles.menuButton}>
            <MaterialIcons name="menu" size={rf(24)} color="white" />
          </TouchableOpacity>
        </View>

        {/* Guest Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={styles.profileImageTouchable}
              onPress={handleLogin}
            >
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.textSecondary }]}>
                <MaterialIcons name="person" size={rf(40)} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {t('guestUser') || 'Guest User'}
            </Text>
            <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
              {t('notLoggedIn') || 'Not logged in'}
            </Text>
            
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
            >
              <Text style={[styles.loginButtonText, { color: 'white' }]}>
                {t('login') || 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem, 
        { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border,
          borderBottomWidth: index < profileMenuItems.length - 1 ? 1 : 0
        }
      ]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <MaterialIcons name={item.icon} size={rf(22)} color={colors.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
      
      <View style={styles.menuItemRight}>
        {item.requiresAuth && !isAuthenticated && (
          <View style={[styles.lockBadge, { backgroundColor: colors.error }]}>
            <MaterialIcons name="lock" size={rf(10)} color={colors.textInverse} />
          </View>
        )}
        
        <MaterialIcons name="chevron-right" size={rf(20)} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        {loadingProfile ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('loadingProfile')}
            </Text>
          </View>
        ) : (
          renderProfileHeader()
        )}

        {/* Profile Information Table */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('profileInformation') || 'Profile Information'}
            </Text>
            <View style={[styles.infoTable, { backgroundColor: colors.surface }]}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('fullName') || 'Full Name'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.full_name || getUserDisplayName() || 'User'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('age') || 'Age'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.age || '25'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('gender') || 'Gender'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.gender ? t(userProfile.gender) : 'Male'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('city') || 'City'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.city || 'New York'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('phoneNumber') || 'Phone Number'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {getUserPhone() || t('notProvided') || 'Not provided'}
                </Text>
              </View>
              
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('memberSince') || 'Member Since'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'December 23, 2025'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditProfile}
            >
              <MaterialIcons name="edit" size={rf(18)} color="white" />
              <Text style={[styles.editButtonText, { color: 'white' }]}>
                {t('editProfile') || 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        {isAuthenticated && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={rf(20)} color={colors.error} />
              <Text style={[styles.logoutButtonText, { color: colors.error }]}>
                {t('logout')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('editProfile')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <MaterialIcons name="close" size={rf(24)} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('personalInformation')}
            </Text>
            
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('firstName')}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('enterFirstName')}
                placeholderTextColor={colors.textSecondary}
                value={editForm.first_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, first_name: text }))}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('lastName')}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('enterLastName')}
                placeholderTextColor={colors.textSecondary}
                value={editForm.last_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, last_name: text }))}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('dateOfBirth')}
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: editForm.date_of_birth ? colors.text : colors.textSecondary }]}>
                  {editForm.date_of_birth ? new Date(editForm.date_of_birth).toLocaleDateString() : t('selectDateOfBirth')}
                </Text>
                <MaterialIcons name="calendar-today" size={rf(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('gender')}
              </Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map((genderOption) => (
                  <TouchableOpacity
                    key={genderOption}
                    style={[
                      styles.genderButton,
                      { 
                        backgroundColor: editForm.gender === genderOption ? colors.primary : colors.surface,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, gender: genderOption as any }))}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      { color: editForm.gender === genderOption ? colors.textInverse : colors.text }
                    ]}>
                      {t(genderOption)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('city')}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('enterCity')}
                placeholderTextColor={colors.textSecondary}
                value={editForm.city}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, city: text }))}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={loadingProfile}
            >
              <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
                {loadingProfile ? t('loading') : t('saveChanges')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    paddingTop: rs(50),
  },
  backButton: {
    padding: rs(8),
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: '600',
  },
  menuButton: {
    padding: rs(8),
  },
  
  // Profile Section
  profileSection: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(24),
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: rs(16),
  },
  profileImageTouchable: {
    position: 'relative',
  },
  profileImage: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
  },
  profileImagePlaceholder: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileDetails: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: rf(24),
    fontWeight: '700',
    marginBottom: rs(4),
  },
  memberSince: {
    fontSize: rf(14),
    marginBottom: rs(12),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    marginRight: rs(6),
  },
  statusText: {
    fontSize: rf(12),
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(10),
    borderRadius: rs(20),
    marginTop: rs(12),
  },
  loginButtonText: {
    fontSize: rf(14),
    fontWeight: '600',
  },
  
  // Stats Container
  statsContainer: {
    paddingHorizontal: rs(24),
    paddingBottom: rs(16),
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: rs(12),
    padding: rs(20),
    elevation: 2,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: rf(24),
    fontWeight: '700',
    marginTop: rs(8),
    marginBottom: rs(4),
  },
  statLabel: {
    fontSize: rf(14),
    fontWeight: '500',
  },
  
  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: rs(24),
    paddingBottom: rs(16),
    gap: rs(8),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(12),
    borderRadius: rs(8),
    gap: rs(6),
  },
  activeTab: {
    elevation: 2,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  tabText: {
    fontSize: rf(12),
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: {
    padding: rs(40),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: rf(16),
  },
  
  // Sections
  section: {
    marginBottom: rs(24),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '700',
    marginBottom: rs(16),
    marginHorizontal: rs(24),
  },
  
  // Info Table
  infoTable: {
    marginHorizontal: rs(24),
    borderRadius: rs(12),
    elevation: 2,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: rf(14),
    fontWeight: '500',
  },
  infoValue: {
    fontSize: rf(14),
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: rs(16),
  },
  
  // Edit Button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: rs(24),
    marginTop: rs(16),
    paddingVertical: rs(14),
    borderRadius: rs(8),
    gap: rs(8),
  },
  editButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(16),
    marginHorizontal: rs(24),
    borderRadius: rs(12),
    elevation: 2,
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.1,
    shadowRadius: rs(2),
  },
  logoutButtonText: {
    fontSize: rf(15),
    fontWeight: '600',
    marginLeft: rs(6),
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.1,
    shadowRadius: rs(2),
  },
  modalTitle: {
    fontSize: rf(17),
    fontWeight: '700',
  },
  closeButton: {
    padding: rs(6),
    borderRadius: rs(12),
  },
  modalContent: {
    flex: 1,
    padding: rs(16),
  },
  
  // Form Styles
  inputGroup: {
    marginBottom: rs(16),
  },
  inputLabel: {
    fontSize: rf(14),
    fontWeight: '600',
    marginBottom: rs(6),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: rs(8),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    fontSize: rf(14),
    minHeight: rs(42),
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rs(8),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    minHeight: rs(42),
  },
  dateButtonText: {
    fontSize: rf(14),
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
  },
  genderButton: {
    paddingHorizontal: rs(14),
    paddingVertical: rs(8),
    borderRadius: rs(16),
    borderWidth: 1,
    minWidth: rs(65),
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: rf(13),
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: rs(8),
    paddingVertical: rs(12),
    alignItems: 'center',
    marginTop: rs(20),
    elevation: 2,
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.1,
    shadowRadius: rs(2),
  },
  saveButtonText: {
    fontSize: rf(15),
    fontWeight: '700',
  },
});