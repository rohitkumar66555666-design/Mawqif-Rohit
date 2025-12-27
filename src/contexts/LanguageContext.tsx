import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'mr' | 'ur' | 'hi';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation keys and their values for each language
const translations = {
  en: {
    // App Name
    appName: 'Mawqif',
    appSubtitle: 'Your prayer spaces hub',
    
    // Navigation
    home: 'Home',
    map: 'Map',
    add: 'Add',
    browse: 'Browse',
    theme: 'Theme',
    language: 'Language',
    profile: 'Profile',
    host: 'Host',
    notifications: 'Notifications',
    placeDetails: 'Place Details',
    
    // Home Screen
    findingLocation: 'Finding your location...',
    noPrayerSpaces: 'No prayer spaces found',
    noPlacesInArea: 'No places found in your area.',
    noPlacesWithinRadius: 'No places found within {radius}km of your location.',
    tapAddPlace: 'Tap "Add Place" below to add a prayer space in this area.',
    unableToLoad: 'Unable to load places',
    tryAgain: 'Try Again',
    refresh: 'Refresh',
    showing: 'Showing',
    of: 'of',
    places: 'places',
    
    // Search
    searchPlaceholder: 'Search city, masjid, address...',
    
    // Place Card
    capacity: 'Capacity',
    imageUnavailable: 'Image unavailable',
    
    // Add Place Screen
    helpFellowMuslims: 'Help fellow Muslims by adding a prayer space in your area.',
    placeName: 'Place Name',
    required: 'required',
    enterPlaceName: 'Enter place name (e.g., Al-Noor Masjid)',
    address: 'Address',
    enterFullAddress: 'Enter full address (e.g., 123 Main Street, Andheri West)',
    typeOfPlace: 'Type of Place',
    city: 'City',
    enterCity: 'e.g., Mumbai, Delhi',
    capacityOptional: 'Capacity (Optional)',
    enterCapacity: 'e.g., 50',
    contactInformation: 'Contact Information (Optional)',
    phoneNumber: 'Phone Number',
    enterPhone: 'e.g., +91 9876543210',
    whatsappNumber: 'WhatsApp Number',
    availableAmenities: 'Available Amenities',
    wuzu: 'Wuzu',
    washroom: 'Washroom',
    women_area: 'Women Area',
    photo: 'Photo',
    addPhoto: 'Add Photo',
    photoRequired: 'Photo is required',
    addingPlace: 'Adding Place...',
    addPrayerSpace: 'Add Prayer Space',
    
    // Place Types
    masjid: 'Masjid',
    musalla: 'Musalla',
    community: 'Community Center',
    outdoor: 'Outdoor Space',
    home: 'Home',
    office: 'Office',
    shop: 'Shop',
    other: 'Other',
    
    // Theme Screen
    chooseTheme: 'Choose Theme',
    selectPreferredAppearance: 'Select your preferred appearance',
    lightMode: 'Light Mode',
    lightModeDesc: 'Clean and bright interface for daytime use',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Easy on the eyes for low-light environments',
    themeChangesInstant: 'Theme changes are applied instantly throughout the app',
    
    // Language Screen
    chooseLanguage: 'Choose Language',
    selectPreferredLanguage: 'Select your preferred language',
    languageChangesInstant: 'Language changes are applied instantly throughout the app',
    
    // Filter Modal
    filters: 'Filters',
    reset: 'Reset',
    placeAdded: 'Place Added',
    minimumRating: 'Minimum Rating',
    womenAreaFilter: 'Women\'s Area',
    searchRadius: 'Search Radius',
    typeOfPlaceFilter: 'Type of Place',
    applyFilters: 'Apply Filters',
    yes: 'Yes',
    no: 'No',
    
    // Time filters
    lastHour: 'Last Hour',
    lastDay: 'Last Day',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    
    // Common
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    ok: 'OK',
    back: 'Back',
    next: 'Next',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    
    // Reviews
    review: 'review',
    reviews: 'reviews',
    noReviewsYet: 'No reviews yet',
    userReviews: 'User Reviews',
    writeReview: 'WRITE REVIEW',
    reviewRules: 'Please read and apply the rules before posting a review.',
    reviewTerms: 'By sharing your review, you agree to all the relevant terms.',
    newest: 'Newest',
    mostLiked: 'Most Liked',
    oldest: 'Oldest',
    noReviewsMessage: 'Be the first to share your experience about this place!',
    
    // Contact & Actions
    contactInformation: 'Contact Information:',
    call: 'Call',
    notProvided: 'Not provided',
    whatsapp: 'WhatsApp',
    getDirections: 'Get Directions',
    
    // Review Modal
    writeAReview: 'Write a Review',
    post: 'Post',
    howWouldYouRate: 'How would you rate this place?',
    tapStarsToRate: 'Tap the stars to select your rating',
    shareYourExperience: 'Share Your Experience',
    tellOthersAboutVisit: 'Tell others about your visit',
    shareExperiencePlaceholder: 'Share your experience about this place...',
    charactersCount: 'characters',
    tipsForGreatReview: '💡 Tips for a great review:',
    tipBeSpecific: '• Be specific about your experience',
    tipMentionLikes: '• Mention what you liked or didn\'t like',
    tipHelpOthers: '• Help others make informed decisions',
    tipKeepRespectful: '• Keep it respectful and honest',
    writeFirstReview: 'Write First Review',
    reply: 'Reply',
    report: 'Report',
    
    // Validation Messages
    titleRequired: 'Place name is required',
    addressRequired: 'Address is required',
    cityRequired: 'City is required',
    locationRequired: 'Location is required',
    
    // Success Messages
    placeAddedSuccess: 'Prayer space added successfully!',
    viewPlaces: 'View Places',
    
    // Error Messages
    locationPermissionRequired: 'Location permission is required to find nearby prayer spaces',
    unableToGetLocation: 'Unable to get your location. Please check your GPS settings.',
    noInternetConnection: 'Unable to load places. Please check your internet connection and try again.',
    
    // Profile Screen
    profileInformation: 'Profile Information',
    fullName: 'Full Name',
    age: 'Age',
    gender: 'Gender',
    memberSince: 'Member Since',
    notProvided: 'Not provided',
    updateProfile: 'Update Profile',
    signOut: 'Sign Out',
    
    // Profile Menu Items
    myPlaces: 'My Places',
    placesYouAdded: 'Places you have added',
    myReviews: 'My Reviews', 
    reviewsYouWrote: 'Reviews you have written',
    favorites: 'Favorites',
    savedPlaces: 'Your saved places',
    darkLightMode: 'Dark/Light mode',
    changeLanguage: 'Change app language',
    offlineCache: 'Offline Cache',
    manageOfflineData: 'Manage offline data',
    
    // Profile States
    guestUser: 'Guest User',
    notLoggedIn: 'Not logged in',
    verified: 'Verified',
    phoneNotProvided: 'Phone not provided',
    
    // Profile Actions
    logout: 'Logout',
    logoutConfirmation: 'Are you sure you want to logout?',
    loggedOutSuccessfully: 'Logged out successfully',
    
    // Settings
    settings: 'Settings',
    account: 'Account',
    pushNotifications: 'Push notifications',
    locationServices: 'Location Services',
    enableLocationAccess: 'Enable location access',
    
    // Coming Soon Features
    comingSoon: 'Coming Soon',
    myPlacesFeature: 'My Places feature will be available soon',
    myReviewsFeature: 'My Reviews feature will be available soon', 
    favoritesFeature: 'Favorites feature will be available soon',
    editProfileFeature: 'Edit Profile feature will be available soon',
    
    // App Info
    appDescription: 'Find prayer spaces near you and help the community by sharing new locations',
    
    // Bookmarks
    bookmarks: 'Bookmarks',
    myBookmarks: 'My Bookmarks',
    yourSavedPlaces: 'Your saved places',
    bookmarkAdded: 'Place bookmarked successfully!',
    bookmarkRemoved: 'Bookmark removed successfully!',
    removeBookmark: 'Remove Bookmark',
    removeBookmarkConfirmation: 'Are you sure you want to remove bookmark for',
    bookmarkRemovedSuccessfully: 'Bookmark removed successfully',
    failedToRemoveBookmark: 'Failed to remove bookmark',
    failedToUpdateBookmark: 'Failed to update bookmark',
    loginRequiredForBookmarks: 'Please login to bookmark places and access your saved locations.',
    loginToViewBookmarks: 'Please login to view your bookmarks',
    loadingBookmarks: 'Loading bookmarks...',
    bookmarkStatistics: 'Bookmark Statistics',
    totalBookmarks: 'Total Bookmarks',
    byType: 'By Type',
    bookmarkedOn: 'Bookmarked on',
    remove: 'Remove',
    placesAdded: 'Places Added',
    info: 'Info',
    noBookmarksYet: 'No Bookmarks Yet',
    startBookmarking: 'Start bookmarking places you want to visit later',
    noReviewsYetProfile: 'No Reviews Yet',
    shareExperiences: 'Share your experiences by writing reviews',
    loadingProfile: 'Loading profile...',
    profileImageUpdated: 'Profile image updated successfully!',
    profileUpdated: 'Profile updated successfully!',
    signOutConfirm: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    enterFullName: 'Enter your full name',
    enterEmail: 'Enter your email',
    enterAge: 'Enter your age',
    enterGender: 'Enter your gender',
    enterCity: 'Enter your city',
    selectImage: 'Select Image',
    camera: 'Camera',
    gallery: 'Gallery',
    permissionRequired: 'Permission Required',
    cameraPermissionRequired: 'Please grant camera permissions to take photos.',
    galleryPermissionRequired: 'Please grant camera roll permissions to upload images.',
    failedToUploadImage: 'Failed to upload image. Please try again.',
    failedToOpenCamera: 'Failed to open camera',
    failedToOpenGallery: 'Failed to open gallery',
    active: 'ACTIVE',
    likes: 'likes',
    
    // Login & Authentication
    loginRequired: 'Login Required',
    loginRequiredMessage: 'Please login with your phone number to access directions and premium features.',
    login: 'Login',
    welcomeToMawqif: 'Welcome to Mawqif',
    enterPhoneForPremium: 'Enter your phone number to access premium features',
    phoneNumber: 'Phone Number',
    enterMobileNumber: 'Enter 10-digit mobile number',
    premiumFeatures: 'Premium Features:',
    uploadPlaceImages: 'Upload place images',
    addReviewsRatings: 'Add reviews and ratings',
    bookmarkFavorites: 'Bookmark favorite places',
    listYourPlaces: 'List your own places',
    sendOTP: 'Send OTP',
    verifyOTP: 'Verify OTP',
    enterOTPSent: 'Enter the 6-digit code sent to',
    otpCode: 'OTP Code',
    enter6DigitOTP: 'Enter 6-digit OTP',
    resendOTPIn: 'Resend OTP in',
    seconds: 'seconds',
    resendOTP: 'Resend OTP',
    verifyAndLogin: 'Verify & Login',
    changePhoneNumber: 'Change Phone Number',
    loginSuccessful: 'Login successful!',
    continue: 'Continue',
    invalidPhoneNumber: 'Invalid Phone Number',
    validMobileNumberRequired: 'Please enter a valid 10-digit mobile number',
    invalidOTP: 'Invalid OTP',
    valid6DigitOTPRequired: 'Please enter a valid 6-digit OTP',
    verificationFailed: 'Verification Failed',
    
    // User Profile Data
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    enterFirstName: 'Enter your first name',
    enterLastName: 'Enter your last name',
    selectDateOfBirth: 'Select your date of birth',
    selectGender: 'Select your gender',
    profileCompleted: 'Profile completed successfully!',
    profileCompletionRequired: 'Please complete your profile',
    completeProfile: 'Complete Profile',
    editProfile: 'Edit Profile',
    personalInformation: 'Personal Information',
    years: 'years',
    yearsOld: 'years old',
    invalidBirthDate: 'Please select a valid birth date (not in the future)',
    birthDateTooOld: 'Please select a more recent birth date',
    
    // My Reviews Screen
    reviewStatistics: 'Review Statistics',
    totalReviews: 'Total Reviews',
    averageRating: 'Average Rating',
    totalLikes: 'Total Likes',
    yourReviews: 'Your Reviews',
    deleteReview: 'Delete Review',
    deleteReviewConfirmation: 'Are you sure you want to delete your review for',
    reviewDeletedSuccessfully: 'Review deleted successfully',
    failedToDeleteReview: 'Failed to delete review',
    editReviewFeature: 'Edit review feature coming soon',
    noReviewsYet: 'No Reviews Yet',
    startWritingReviews: 'Start writing reviews to share your experiences',
    explorePlaces: 'Explore Places',
    loginToViewReviews: 'Please login to view your reviews',
    loadingReviews: 'Loading reviews...',
  },
  
  mr: {
    // App Name
    appName: 'मावकिफ',
    appSubtitle: 'तुमच्या नमाज स्थळांचे केंद्र',
    
    // Navigation
    home: 'होम',
    map: 'नकाशा',
    add: 'जोडा',
    browse: 'ब्राउझ',
    theme: 'थीम',
    language: 'भाषा',
    profile: 'प्रोफाइल',
    host: 'होस्ट',
    notifications: 'सूचना',
    placeDetails: 'स्थळ तपशील',
    
    // Home Screen
    findingLocation: 'तुमचे स्थान शोधत आहे...',
    noPrayerSpaces: 'कोणतेही नमाज स्थळ सापडले नाही',
    noPlacesInArea: 'तुमच्या परिसरात कोणतेही स्थळ सापडले नाही.',
    noPlacesWithinRadius: 'तुमच्या स्थानापासून {radius} किमी च्या आत कोणतेही स्थळ सापडले नाही.',
    tapAddPlace: 'या परिसरात नमाज स्थळ जोडण्यासाठी खाली "स्थळ जोडा" वर टॅप करा.',
    unableToLoad: 'स्थळे लोड करू शकत नाही',
    tryAgain: 'पुन्हा प्रयत्न करा',
    refresh: 'रिफ्रेश',
    showing: 'दाखवत आहे',
    of: 'पैकी',
    places: 'स्थळे',
    
    // Search
    searchPlaceholder: 'शहर, मशीद, पत्ता शोधा...',
    
    // Place Card
    capacity: 'क्षमता',
    imageUnavailable: 'प्रतिमा उपलब्ध नाही',
    
    // Add Place Screen
    helpFellowMuslims: 'तुमच्या परिसरात नमाज स्थळ जोडून सहकारी मुस्लिमांना मदत करा.',
    placeName: 'स्थळाचे नाव',
    required: 'आवश्यक',
    enterPlaceName: 'स्थळाचे नाव प्रविष्ट करा (उदा. अल-नूर मशीद)',
    address: 'पत्ता',
    enterFullAddress: 'संपूर्ण पत्ता प्रविष्ट करा (उदा. 123 मेन स्ट्रीट, अंधेरी वेस्ट)',
    typeOfPlace: 'स्थळाचा प्रकार',
    city: 'शहर',
    enterCity: 'उदा. मुंबई, दिल्ली',
    capacityOptional: 'क्षमता (पर्यायी)',
    enterCapacity: 'उदा. 50',
    contactInformation: 'संपर्क माहिती (पर्यायी)',
    phoneNumber: 'फोन नंबर',
    enterPhone: 'उदा. +91 9876543210',
    whatsappNumber: 'व्हाट्सअॅप नंबर',
    availableAmenities: 'उपलब्ध सुविधा',
    wuzu: 'वुजू',
    washroom: 'वॉशरूम',
    women_area: 'महिला क्षेत्र',
    photo: 'फोटो',
    addPhoto: 'फोटो जोडा',
    photoRequired: 'फोटो आवश्यक आहे',
    addingPlace: 'स्थळ जोडत आहे...',
    addPrayerSpace: 'नमाज स्थळ जोडा',
    
    // Place Types
    masjid: 'मशीद',
    musalla: 'मुसल्ला',
    community: 'समुदायिक केंद्र',
    outdoor: 'बाहेरील जागा',
    home: 'घर',
    office: 'कार्यालय',
    shop: 'दुकान',
    other: 'इतर',
    
    // Theme Screen
    chooseTheme: 'थीम निवडा',
    selectPreferredAppearance: 'तुमची पसंतीची दिखावा निवडा',
    lightMode: 'लाइट मोड',
    lightModeDesc: 'दिवसाच्या वेळी वापरासाठी स्वच्छ आणि उज्ज्वल इंटरफेस',
    darkMode: 'डार्क मोड',
    darkModeDesc: 'कमी प्रकाशाच्या वातावरणात डोळ्यांसाठी सोपे',
    themeChangesInstant: 'थीम बदल संपूर्ण अॅपमध्ये तत्काळ लागू होतात',
    
    // Language Screen
    chooseLanguage: 'भाषा निवडा',
    selectPreferredLanguage: 'तुमची पसंतीची भाषा निवडा',
    languageChangesInstant: 'भाषा बदल संपूर्ण अॅपमध्ये तत्काळ लागू होतात',
    
    // Filter Modal
    filters: 'फिल्टर',
    reset: 'रीसेट',
    placeAdded: 'स्थळ जोडले',
    minimumRating: 'किमान रेटिंग',
    womenAreaFilter: 'महिला क्षेत्र',
    searchRadius: 'शोध त्रिज्या',
    typeOfPlaceFilter: 'स्थळाचा प्रकार',
    applyFilters: 'फिल्टर लागू करा',
    yes: 'होय',
    no: 'नाही',
    
    // Time filters
    lastHour: 'शेवटचा तास',
    lastDay: 'शेवटचा दिवस',
    lastWeek: 'शेवटचा आठवडा',
    lastMonth: 'शेवटचा महिना',
    
    // Common
    success: 'यश',
    error: 'त्रुटी',
    cancel: 'रद्द करा',
    ok: 'ठीक आहे',
    back: 'मागे',
    next: 'पुढे',
    save: 'जतन करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    close: 'बंद करा',
    loading: 'लोड होत आहे...',
    
    // Reviews
    review: 'पुनरावलोकन',
    reviews: 'पुनरावलोकने',
    noReviewsYet: 'अद्याप कोणतेही पुनरावलोकन नाही',
    userReviews: 'वापरकर्ता पुनरावलोकने',
    writeReview: 'पुनरावलोकन लिहा',
    reviewRules: 'पुनरावलोकन पोस्ट करण्यापूर्वी कृपया नियम वाचा आणि लागू करा.',
    reviewTerms: 'तुमचे पुनरावलोकन सामायिक करून, तुम्ही सर्व संबंधित अटींशी सहमत आहात.',
    newest: 'नवीनतम',
    mostLiked: 'सर्वाधिक आवडलेले',
    oldest: 'जुनेतम',
    noReviewsMessage: 'या ठिकाणाबद्दल तुमचा अनुभव सामायिक करणारे पहिले व्हा!',
    
    // Contact & Actions
    contactInformation: 'संपर्क माहिती:',
    call: 'कॉल',
    notProvided: 'प्रदान केले नाही',
    whatsapp: 'व्हाट्सअॅप',
    getDirections: 'दिशा मिळवा',
    
    // Review Modal
    writeAReview: 'पुनरावलोकन लिहा',
    post: 'पोस्ट',
    howWouldYouRate: 'तुम्ही या ठिकाणाला कसे रेट कराल?',
    tapStarsToRate: 'तुमची रेटिंग निवडण्यासाठी तारे टॅप करा',
    shareYourExperience: 'तुमचा अनुभव सामायिक करा',
    tellOthersAboutVisit: 'इतरांना तुमच्या भेटीबद्दल सांगा',
    shareExperiencePlaceholder: 'या ठिकाणाबद्दल तुमचा अनुभव सामायिक करा...',
    charactersCount: 'अक्षरे',
    tipsForGreatReview: '💡 उत्तम पुनरावलोकनासाठी टिप्स:',
    tipBeSpecific: '• तुमच्या अनुभवाबद्दल विशिष्ट व्हा',
    tipMentionLikes: '• तुम्हाला काय आवडले किंवा आवडले नाही ते नमूद करा',
    tipHelpOthers: '• इतरांना माहितीपूर्ण निर्णय घेण्यास मदत करा',
    tipKeepRespectful: '• आदरपूर्ण आणि प्रामाणिक ठेवा',
    writeFirstReview: 'पहिले पुनरावलोकन लिहा',
    reply: 'उत्तर',
    report: 'तक्रार',
    
    // Validation Messages
    titleRequired: 'स्थळाचे नाव आवश्यक आहे',
    addressRequired: 'पत्ता आवश्यक आहे',
    cityRequired: 'शहर आवश्यक आहे',
    locationRequired: 'स्थान आवश्यक आहे',
    
    // Success Messages
    placeAddedSuccess: 'नमाज स्थळ यशस्वीरित्या जोडले!',
    viewPlaces: 'स्थळे पहा',
    
    // Error Messages
    locationPermissionRequired: 'जवळील नमाज स्थळे शोधण्यासाठी स्थान परवानगी आवश्यक आहे',
    unableToGetLocation: 'तुमचे स्थान मिळवू शकत नाही. कृपया तुमची GPS सेटिंग्ज तपासा.',
    noInternetConnection: 'स्थळे लोड करू शकत नाही. कृपया तुमचे इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
    
    // Profile Screen
    profileInformation: 'प्रोफाइल माहिती',
    fullName: 'पूर्ण नाव',
    age: 'वय',
    gender: 'लिंग',
    memberSince: 'सदस्य कधीपासून',
    notProvided: 'प्रदान केले नाही',
    updateProfile: 'प्रोफाइल अपडेट करा',
    signOut: 'साइन आउट',
    
    // Profile Menu Items
    myPlaces: 'माझी ठिकाणे',
    placesYouAdded: 'तुम्ही जोडलेली ठिकाणे',
    myReviews: 'माझे पुनरावलोकन',
    reviewsYouWrote: 'तुम्ही लिहिलेले पुनरावलोकन',
    favorites: 'आवडते',
    savedPlaces: 'तुमची जतन केलेली ठिकाणे',
    darkLightMode: 'डार्क/लाइट मोड',
    changeLanguage: 'अॅप भाषा बदला',
    offlineCache: 'ऑफलाइन कॅश',
    manageOfflineData: 'ऑफलाइन डेटा व्यवस्थापित करा',
    
    // Profile States
    guestUser: 'अतिथी वापरकर्ता',
    notLoggedIn: 'लॉग इन केले नाही',
    verified: 'सत्यापित',
    phoneNotProvided: 'फोन प्रदान केला नाही',
    
    // Profile Actions
    logout: 'लॉगआउट',
    logoutConfirmation: 'तुम्हाला खात्री आहे की तुम्ही लॉगआउट करू इच्छिता?',
    loggedOutSuccessfully: 'यशस्वीरित्या लॉगआउट झाले',
    
    // Settings
    settings: 'सेटिंग्ज',
    account: 'खाते',
    pushNotifications: 'पुश सूचना',
    locationServices: 'स्थान सेवा',
    enableLocationAccess: 'स्थान प्रवेश सक्षम करा',
    
    // Coming Soon Features
    comingSoon: 'लवकरच येत आहे',
    myPlacesFeature: 'माझी ठिकाणे वैशिष्ट्य लवकरच उपलब्ध होईल',
    myReviewsFeature: 'माझे पुनरावलोकन वैशिष्ट्य लवकरच उपलब्ध होईल',
    favoritesFeature: 'आवडते वैशिष्ट्य लवकरच उपलब्ध होईल',
    editProfileFeature: 'प्रोफाइल संपादित करा वैशिष्ट्य लवकरच उपलब्ध होईल',
    
    // App Info
    appDescription: 'तुमच्या जवळील नमाज स्थळे शोधा आणि नवीन स्थाने सामायिक करून समुदायाला मदत करा',
    
    // Bookmarks
    bookmarks: 'बुकमार्क',
    myBookmarks: 'माझे बुकमार्क',
    yourSavedPlaces: 'तुमची जतन केलेली ठिकाणे',
    bookmarkAdded: 'स्थळ यशस्वीरित्या बुकमार्क केले!',
    bookmarkRemoved: 'बुकमार्क यशस्वीरित्या काढले!',
    removeBookmark: 'बुकमार्क काढा',
    removeBookmarkConfirmation: 'तुम्हाला खात्री आहे की तुम्ही बुकमार्क काढू इच्छिता',
    bookmarkRemovedSuccessfully: 'बुकमार्क यशस्वीरित्या काढले',
    failedToRemoveBookmark: 'बुकमार्क काढण्यात अयशस्वी',
    failedToUpdateBookmark: 'बुकमार्क अपडेट करण्यात अयशस्वी',
    loginRequiredForBookmarks: 'ठिकाणे बुकमार्क करण्यासाठी आणि तुमची जतन केलेली स्थाने पाहण्यासाठी कृपया लॉगिन करा.',
    loginToViewBookmarks: 'तुमचे बुकमार्क पाहण्यासाठी कृपया लॉगिन करा',
    loadingBookmarks: 'बुकमार्क लोड होत आहेत...',
    bookmarkStatistics: 'बुकमार्क आकडेवारी',
    totalBookmarks: 'एकूण बुकमार्क',
    byType: 'प्रकारानुसार',
    bookmarkedOn: 'बुकमार्क केले',
    remove: 'काढा',
    placesAdded: 'जोडलेली ठिकाणे',
    info: 'माहिती',
    noBookmarksYet: 'अद्याप कोणतेही बुकमार्क नाही',
    startBookmarking: 'नंतर भेट देण्यासाठी ठिकाणे बुकमार्क करणे सुरू करा',
    noReviewsYetProfile: 'अद्याप कोणतेही पुनरावलोकन नाही',
    shareExperiences: 'पुनरावलोकन लिहून तुमचे अनुभव सामायिक करा',
    loadingProfile: 'प्रोफाइल लोड होत आहे...',
    profileImageUpdated: 'प्रोफाइल इमेज यशस्वीरित्या अपडेट झाली!',
    profileUpdated: 'प्रोफाइल यशस्वीरित्या अपडेट झाले!',
    signOutConfirm: 'तुम्हाला खात्री आहे की तुम्ही साइन आउट करू इच्छिता?',
    cancel: 'रद्द करा',
    saveChanges: 'बदल जतन करा',
    enterFullName: 'तुमचे पूर्ण नाव प्रविष्ट करा',
    enterEmail: 'तुमचा ईमेल प्रविष्ट करा',
    enterAge: 'तुमचे वय प्रविष्ट करा',
    enterGender: 'तुमचे लिंग प्रविष्ट करा',
    enterCity: 'तुमचे शहर प्रविष्ट करा',
    selectImage: 'इमेज निवडा',
    camera: 'कॅमेरा',
    gallery: 'गॅलरी',
    permissionRequired: 'परवानगी आवश्यक',
    cameraPermissionRequired: 'फोटो घेण्यासाठी कृपया कॅमेरा परवानगी द्या.',
    galleryPermissionRequired: 'इमेज अपलोड करण्यासाठी कृपया कॅमेरा रोल परवानगी द्या.',
    failedToUploadImage: 'इमेज अपलोड करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
    failedToOpenCamera: 'कॅमेरा उघडण्यात अयशस्वी',
    failedToOpenGallery: 'गॅलरी उघडण्यात अयशस्वी',
    active: 'सक्रिय',
    likes: 'आवडी',
    
    // Login & Authentication
    loginRequired: 'लॉगिन आवश्यक',
    loginRequiredMessage: 'दिशा आणि प्रीमियम वैशिष्ट्यांमध्ये प्रवेश करण्यासाठी कृपया तुमच्या फोन नंबरसह लॉगिन करा.',
    login: 'लॉगिन',
    welcomeToMawqif: 'मावकिफमध्ये आपले स्वागत',
    enterPhoneForPremium: 'प्रीमियम वैशिष्ट्यांमध्ये प्रवेश करण्यासाठी तुमचा फोन नंबर प्रविष्ट करा',
    phoneNumber: 'फोन नंबर',
    enterMobileNumber: '10-अंकी मोबाइल नंबर प्रविष्ट करा',
    premiumFeatures: 'प्रीमियम वैशिष्ट्ये:',
    uploadPlaceImages: 'स्थळाच्या प्रतिमा अपलोड करा',
    addReviewsRatings: 'पुनरावलोकन आणि रेटिंग जोडा',
    bookmarkFavorites: 'आवडते स्थळे बुकमार्क करा',
    listYourPlaces: 'तुमची स्वतःची ठिकाणे सूचीबद्ध करा',
    sendOTP: 'OTP पाठवा',
    verifyOTP: 'OTP सत्यापित करा',
    enterOTPSent: 'पाठवलेला 6-अंकी कोड प्रविष्ट करा',
    otpCode: 'OTP कोड',
    enter6DigitOTP: '6-अंकी OTP प्रविष्ट करा',
    resendOTPIn: 'OTP पुन्हा पाठवा',
    seconds: 'सेकंदात',
    resendOTP: 'OTP पुन्हा पाठवा',
    verifyAndLogin: 'सत्यापित करा आणि लॉगिन करा',
    changePhoneNumber: 'फोन नंबर बदला',
    loginSuccessful: 'लॉगिन यशस्वी!',
    continue: 'सुरू ठेवा',
    invalidPhoneNumber: 'अवैध फोन नंबर',
    validMobileNumberRequired: 'कृपया वैध 10-अंकी मोबाइल नंबर प्रविष्ट करा',
    invalidOTP: 'अवैध OTP',
    valid6DigitOTPRequired: 'कृपया वैध 6-अंकी OTP प्रविष्ट करा',
    verificationFailed: 'सत्यापन अयशस्वी',
    
    // User Profile Data
    firstName: 'पहिले नाव',
    lastName: 'आडनाव',
    dateOfBirth: 'जन्मतारीख',
    male: 'पुरुष',
    female: 'स्त्री',
    other: 'इतर',
    enterFirstName: 'तुमचे पहिले नाव प्रविष्ट करा',
    enterLastName: 'तुमचे आडनाव प्रविष्ट करा',
    selectDateOfBirth: 'तुमची जन्मतारीख निवडा',
    selectGender: 'तुमचे लिंग निवडा',
    profileCompleted: 'प्रोफाइल यशस्वीरित्या पूर्ण झाले!',
    profileCompletionRequired: 'कृपया तुमची प्रोफाइल पूर्ण करा',
    completeProfile: 'प्रोफाइल पूर्ण करा',
    editProfile: 'प्रोफाइल संपादित करा',
    personalInformation: 'वैयक्तिक माहिती',
    years: 'वर्षे',
    yearsOld: 'वर्षांचे',
    
    // My Reviews Screen
    reviewStatistics: 'पुनरावलोकन आकडेवारी',
    totalReviews: 'एकूण पुनरावलोकने',
    averageRating: 'सरासरी रेटिंग',
    totalLikes: 'एकूण आवडी',
    yourReviews: 'तुमची पुनरावलोकने',
    deleteReview: 'पुनरावलोकन हटवा',
    deleteReviewConfirmation: 'तुम्हाला खात्री आहे की तुम्ही तुमचे पुनरावलोकन हटवू इच्छिता',
    reviewDeletedSuccessfully: 'पुनरावलोकन यशस्वीरित्या हटवले',
    failedToDeleteReview: 'पुनरावलोकन हटवण्यात अयशस्वी',
    editReviewFeature: 'पुनरावलोकन संपादित करा वैशिष्ट्य लवकरच येत आहे',
    noReviewsYet: 'अद्याप कोणतेही पुनरावलोकन नाही',
    startWritingReviews: 'तुमचे अनुभव सामायिक करण्यासाठी पुनरावलोकन लिहिणे सुरू करा',
    explorePlaces: 'ठिकाणे एक्सप्लोर करा',
    loginToViewReviews: 'तुमची पुनरावलोकने पाहण्यासाठी कृपया लॉगिन करा',
    loadingReviews: 'पुनरावलोकने लोड होत आहेत...',
  },
  
  ur: {
    // App Name
    appName: 'موقف',
    appSubtitle: 'آپ کے نماز کی جگہوں کا مرکز',
    
    // Navigation
    home: 'ہوم',
    map: 'نقشہ',
    add: 'شامل کریں',
    browse: 'براؤز',
    theme: 'تھیم',
    language: 'زبان',
    profile: 'پروفائل',
    host: 'میزبان',
    notifications: 'اطلاعات',
    placeDetails: 'جگہ کی تفصیلات',
    
    // Home Screen
    findingLocation: 'آپ کا مقام تلاش کر رہے ہیں...',
    noPrayerSpaces: 'کوئی نماز کی جگہ نہیں ملی',
    noPlacesInArea: 'آپ کے علاقے میں کوئی جگہ نہیں ملی۔',
    noPlacesWithinRadius: 'آپ کے مقام سے {radius} کلومیٹر کے اندر کوئی جگہ نہیں ملی۔',
    tapAddPlace: 'اس علاقے میں نماز کی جگہ شامل کرنے کے لیے نیچے "جگہ شامل کریں" پر ٹیپ کریں۔',
    unableToLoad: 'جگہیں لوڈ کرنے میں ناکام',
    tryAgain: 'دوبارہ کوشش کریں',
    refresh: 'ریفریش',
    showing: 'دکھا رہے ہیں',
    of: 'میں سے',
    places: 'جگہیں',
    
    // Search
    searchPlaceholder: 'شہر، مسجد، پتہ تلاش کریں...',
    
    // Place Card
    capacity: 'گنجائش',
    imageUnavailable: 'تصویر دستیاب نہیں',
    
    // Add Place Screen
    helpFellowMuslims: 'اپنے علاقے میں نماز کی جگہ شامل کر کے ساتھی مسلمانوں کی مدد کریں۔',
    placeName: 'جگہ کا نام',
    required: 'ضروری',
    enterPlaceName: 'جگہ کا نام درج کریں (جیسے: النور مسجد)',
    address: 'پتہ',
    enterFullAddress: 'مکمل پتہ درج کریں (جیسے: 123 مین سٹریٹ، اندھیری ویسٹ)',
    typeOfPlace: 'جگہ کی قسم',
    city: 'شہر',
    enterCity: 'جیسے: ممبئی، دہلی',
    capacityOptional: 'گنجائش (اختیاری)',
    enterCapacity: 'جیسے: 50',
    contactInformation: 'رابطے کی معلومات (اختیاری)',
    phoneNumber: 'فون نمبر',
    enterPhone: 'جیسے: +91 9876543210',
    whatsappNumber: 'واٹس ایپ نمبر',
    availableAmenities: 'دستیاب سہولات',
    wuzu: 'وضو',
    washroom: 'واش روم',
    women_area: 'خواتین کا علاقہ',
    photo: 'تصویر',
    addPhoto: 'تصویر شامل کریں',
    photoRequired: 'تصویر ضروری ہے',
    addingPlace: 'جگہ شامل کر رہے ہیں...',
    addPrayerSpace: 'نماز کی جگہ شامل کریں',
    
    // Place Types
    masjid: 'مسجد',
    musalla: 'مصلیٰ',
    community: 'کمیونٹی سینٹر',
    outdoor: 'بیرونی جگہ',
    home: 'گھر',
    office: 'دفتر',
    shop: 'دکان',
    other: 'دیگر',
    
    // Theme Screen
    chooseTheme: 'تھیم منتخب کریں',
    selectPreferredAppearance: 'اپنی پسندیدہ ظاہری شکل منتخب کریں',
    lightMode: 'لائٹ موڈ',
    lightModeDesc: 'دن کے وقت استعمال کے لیے صاف اور روشن انٹرفیس',
    darkMode: 'ڈارک موڈ',
    darkModeDesc: 'کم روشنی والے ماحول میں آنکھوں کے لیے آسان',
    themeChangesInstant: 'تھیم کی تبدیلیاں فوری طور پر پوری ایپ میں لاگو ہوتی ہیں',
    
    // Language Screen
    chooseLanguage: 'زبان منتخب کریں',
    selectPreferredLanguage: 'اپنی پسندیدہ زبان منتخب کریں',
    languageChangesInstant: 'زبان کی تبدیلیاں فوری طور پر پوری ایپ میں لاگو ہوتی ہیں',
    
    // Filter Modal
    filters: 'فلٹرز',
    reset: 'ری سیٹ',
    placeAdded: 'جگہ شامل کی گئی',
    minimumRating: 'کم سے کم ریٹنگ',
    womenAreaFilter: 'خواتین کا علاقہ',
    searchRadius: 'تلاش کا دائرہ',
    typeOfPlaceFilter: 'جگہ کی قسم',
    applyFilters: 'فلٹرز لاگو کریں',
    yes: 'ہاں',
    no: 'نہیں',
    
    // Time filters
    lastHour: 'پچھلا گھنٹہ',
    lastDay: 'پچھلا دن',
    lastWeek: 'پچھلا ہفتہ',
    lastMonth: 'پچھلا مہینہ',
    
    // Common
    success: 'کامیابی',
    error: 'خرابی',
    cancel: 'منسوخ',
    ok: 'ٹھیک ہے',
    back: 'واپس',
    next: 'اگلا',
    save: 'محفوظ کریں',
    delete: 'حذف کریں',
    edit: 'ترمیم',
    close: 'بند کریں',
    loading: 'لوڈ ہو رہا ہے...',
    
    // Reviews
    review: 'جائزہ',
    reviews: 'جائزے',
    noReviewsYet: 'ابھی تک کوئی جائزہ نہیں',
    userReviews: 'صارف کے جائزے',
    writeReview: 'جائزہ لکھیں',
    reviewRules: 'جائزہ پوسٹ کرنے سے پہلے براہ کرم قوانین پڑھیں اور لاگو کریں۔',
    reviewTerms: 'اپنا جائزہ شیئر کر کے، آپ تمام متعلقہ شرائط سے اتفاق کرتے ہیں۔',
    newest: 'نیا ترین',
    mostLiked: 'سب سے زیادہ پسند',
    oldest: 'پرانا ترین',
    noReviewsMessage: 'اس جگہ کے بارے میں اپنا تجربہ شیئر کرنے والے پہلے بنیں!',
    
    // Contact & Actions
    contactInformation: 'رابطے کی معلومات:',
    call: 'کال',
    notProvided: 'فراہم نہیں کیا گیا',
    whatsapp: 'واٹس ایپ',
    getDirections: 'راستہ حاصل کریں',
    
    // Review Modal
    writeAReview: 'جائزہ لکھیں',
    post: 'پوسٹ',
    howWouldYouRate: 'آپ اس جگہ کو کیسے ریٹ کریں گے؟',
    tapStarsToRate: 'اپنی ریٹنگ منتخب کرنے کے لیے ستاروں پر ٹیپ کریں',
    shareYourExperience: 'اپنا تجربہ شیئر کریں',
    tellOthersAboutVisit: 'دوسروں کو اپنی ملاقات کے بارے میں بتائیں',
    shareExperiencePlaceholder: 'اس جگہ کے بارے میں اپنا تجربہ شیئر کریں...',
    charactersCount: 'حروف',
    tipsForGreatReview: '💡 بہترین جائزے کے لیے تجاویز:',
    tipBeSpecific: '• اپنے تجربے کے بارے میں مخصوص بنیں',
    tipMentionLikes: '• بتائیں کہ آپ کو کیا پسند آیا یا نہیں آیا',
    tipHelpOthers: '• دوسروں کو باخبر فیصلے کرنے میں مدد کریں',
    tipKeepRespectful: '• اسے احترام اور ایمانداری سے رکھیں',
    writeFirstReview: 'پہلا جائزہ لکھیں',
    reply: 'جواب',
    report: 'رپورٹ',
    
    // Validation Messages
    titleRequired: 'جگہ کا نام ضروری ہے',
    addressRequired: 'پتہ ضروری ہے',
    cityRequired: 'شہر ضروری ہے',
    locationRequired: 'مقام ضروری ہے',
    
    // Success Messages
    placeAddedSuccess: 'نماز کی جگہ کامیابی سے شامل کر دی گئی!',
    viewPlaces: 'جگہیں دیکھیں',
    
    // Error Messages
    locationPermissionRequired: 'قریبی نماز کی جگہیں تلاش کرنے کے لیے مقام کی اجازت ضروری ہے',
    unableToGetLocation: 'آپ کا مقام حاصل کرنے میں ناکام۔ براہ کرم اپنی GPS سیٹنگز چیک کریں۔',
    noInternetConnection: 'جگہیں لوڈ کرنے میں ناکام۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    
    // Profile Screen
    profileInformation: 'پروفائل کی معلومات',
    fullName: 'پورا نام',
    age: 'عمر',
    gender: 'جنس',
    memberSince: 'ممبر کب سے',
    notProvided: 'فراہم نہیں کیا گیا',
    updateProfile: 'پروفائل اپ ڈیٹ کریں',
    signOut: 'سائن آؤٹ',
    
    // Profile Menu Items
    myPlaces: 'میری جگہیں',
    placesYouAdded: 'آپ نے شامل کردہ جگہیں',
    myReviews: 'میرے جائزے',
    reviewsYouWrote: 'آپ کے لکھے گئے جائزے',
    favorites: 'پسندیدہ',
    savedPlaces: 'آپ کی محفوظ کردہ جگہیں',
    darkLightMode: 'ڈارک/لائٹ موڈ',
    changeLanguage: 'ایپ کی زبان تبدیل کریں',
    offlineCache: 'آف لائن کیش',
    manageOfflineData: 'آف لائن ڈیٹا کا انتظام کریں',
    
    // Profile States
    guestUser: 'مہمان صارف',
    notLoggedIn: 'لاگ ان نہیں',
    verified: 'تصدیق شدہ',
    phoneNotProvided: 'فون فراہم نہیں کیا گیا',
    
    // Profile Actions
    logout: 'لاگ آؤٹ',
    logoutConfirmation: 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟',
    loggedOutSuccessfully: 'کامیابی سے لاگ آؤٹ ہو گئے',
    
    // Settings
    settings: 'سیٹنگز',
    account: 'اکاؤنٹ',
    pushNotifications: 'پش نوٹیفیکیشن',
    locationServices: 'لوکیشن سروسز',
    enableLocationAccess: 'لوکیشن رسائی فعال کریں',
    
    // Coming Soon Features
    comingSoon: 'جلد آ رہا ہے',
    myPlacesFeature: 'میری جگہیں کی سہولت جلد دستیاب ہوگی',
    myReviewsFeature: 'میرے جائزے کی سہولت جلد دستیاب ہوگی',
    favoritesFeature: 'پسندیدہ کی سہولت جلد دستیاب ہوگی',
    editProfileFeature: 'پروفائل ایڈٹ کی سہولت جلد دستیاب ہوگی',
    
    // App Info
    appDescription: 'اپنے قریب نماز کی جگہیں تلاش کریں اور نئے مقامات شیئر کر کے کمیونٹی کی مدد کریں',
    
    // Bookmarks
    bookmarks: 'بک مارکس',
    myBookmarks: 'میرے بک مارکس',
    yourSavedPlaces: 'آپ کی محفوظ کردہ جگہیں',
    bookmarkAdded: 'جگہ کامیابی سے بک مارک کر دی گئی!',
    bookmarkRemoved: 'بک مارک کامیابی سے ہٹا دیا گیا!',
    removeBookmark: 'بک مارک ہٹائیں',
    removeBookmarkConfirmation: 'کیا آپ واقعی بک مارک ہٹانا چاہتے ہیں',
    bookmarkRemovedSuccessfully: 'بک مارک کامیابی سے ہٹا دیا گیا',
    failedToRemoveBookmark: 'بک مارک ہٹانے میں ناکام',
    failedToUpdateBookmark: 'بک مارک اپ ڈیٹ کرنے میں ناکام',
    loginRequiredForBookmarks: 'جگہوں کو بک مارک کرنے اور اپنے محفوظ کردہ مقامات تک رسائی کے لیے براہ کرم لاگ ان کریں۔',
    loginToViewBookmarks: 'اپنے بک مارکس دیکھنے کے لیے براہ کرم لاگ ان کریں',
    loadingBookmarks: 'بک مارکس لوڈ ہو رہے ہیں...',
    bookmarkStatistics: 'بک مارک کی تفصیلات',
    totalBookmarks: 'کل بک مارکس',
    byType: 'قسم کے حساب سے',
    bookmarkedOn: 'بک مارک کیا گیا',
    remove: 'ہٹائیں',
    placesAdded: 'شامل کردہ جگہیں',
    info: 'معلومات',
    noBookmarksYet: 'ابھی تک کوئی بک مارک نہیں',
    startBookmarking: 'بعد میں ملاقات کے لیے جگہوں کو بک مارک کرنا شروع کریں',
    noReviewsYetProfile: 'ابھی تک کوئی جائزہ نہیں',
    shareExperiences: 'جائزے لکھ کر اپنے تجربات شیئر کریں',
    loadingProfile: 'پروفائل لوڈ ہو رہا ہے...',
    profileImageUpdated: 'پروفائل امیج کامیابی سے اپ ڈیٹ ہو گئی!',
    profileUpdated: 'پروفائل کامیابی سے اپ ڈیٹ ہو گیا!',
    signOutConfirm: 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟',
    cancel: 'منسوخ',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    enterFullName: 'اپنا پورا نام درج کریں',
    enterEmail: 'اپنا ای میل درج کریں',
    enterAge: 'اپنی عمر درج کریں',
    enterGender: 'اپنی جنس درج کریں',
    enterCity: 'اپنا شہر درج کریں',
    selectImage: 'تصویر منتخب کریں',
    camera: 'کیمرا',
    gallery: 'گیلری',
    permissionRequired: 'اجازت درکار',
    cameraPermissionRequired: 'تصاویر لینے کے لیے براہ کرم کیمرا کی اجازت دیں۔',
    galleryPermissionRequired: 'تصاویر اپ لوڈ کرنے کے لیے براہ کرم کیمرا رول کی اجازت دیں۔',
    failedToUploadImage: 'تصویر اپ لوڈ کرنے میں ناکام۔ براہ کرم دوبارہ کوشش کریں۔',
    failedToOpenCamera: 'کیمرا کھولنے میں ناکام',
    failedToOpenGallery: 'گیلری کھولنے میں ناکام',
    active: 'فعال',
    likes: 'پسند',
    
    // Login & Authentication
    loginRequired: 'لاگ ان درکار',
    loginRequiredMessage: 'ڈائریکشن اور پریمیم فیچرز تک رسائی کے لیے براہ کرم اپنے فون نمبر سے لاگ ان کریں۔',
    login: 'لاگ ان',
    welcomeToMawqif: 'موقف میں خوش آمدید',
    enterPhoneForPremium: 'پریمیم فیچرز تک رسائی کے لیے اپنا فون نمبر درج کریں',
    phoneNumber: 'فون نمبر',
    enterMobileNumber: '10 ہندسوں کا موبائل نمبر درج کریں',
    premiumFeatures: 'پریمیم فیچرز:',
    uploadPlaceImages: 'جگہ کی تصاویر اپ لوڈ کریں',
    addReviewsRatings: 'جائزے اور ریٹنگز شامل کریں',
    bookmarkFavorites: 'پسندیدہ جگہوں کو بک مارک کریں',
    listYourPlaces: 'اپنی جگہوں کی فہرست بنائیں',
    sendOTP: 'OTP بھیجیں',
    verifyOTP: 'OTP کی تصدیق کریں',
    enterOTPSent: 'بھیجا گیا 6 ہندسوں کا کوڈ درج کریں',
    otpCode: 'OTP کوڈ',
    enter6DigitOTP: '6 ہندسوں کا OTP درج کریں',
    resendOTPIn: 'OTP دوبارہ بھیجیں',
    seconds: 'سیکنڈ میں',
    resendOTP: 'OTP دوبارہ بھیجیں',
    verifyAndLogin: 'تصدیق کریں اور لاگ ان کریں',
    changePhoneNumber: 'فون نمبر تبدیل کریں',
    loginSuccessful: 'لاگ ان کامیاب!',
    continue: 'جاری رکھیں',
    invalidPhoneNumber: 'غلط فون نمبر',
    validMobileNumberRequired: 'براہ کرم درست 10 ہندسوں کا موبائل نمبر درج کریں',
    invalidOTP: 'غلط OTP',
    valid6DigitOTPRequired: 'براہ کرم درست 6 ہندسوں کا OTP درج کریں',
    verificationFailed: 'تصدیق ناکام',
    
    // User Profile Data
    firstName: 'پہلا نام',
    lastName: 'آخری نام',
    dateOfBirth: 'تاریخ پیدائش',
    male: 'مرد',
    female: 'عورت',
    other: 'دیگر',
    enterFirstName: 'اپنا پہلا نام درج کریں',
    enterLastName: 'اپنا آخری نام درج کریں',
    selectDateOfBirth: 'اپنی تاریخ پیدائش منتخب کریں',
    selectGender: 'اپنی جنس منتخب کریں',
    profileCompleted: 'پروفائل کامیابی سے مکمل ہو گیا!',
    profileCompletionRequired: 'براہ کرم اپنا پروفائل مکمل کریں',
    completeProfile: 'پروفائل مکمل کریں',
    editProfile: 'پروفائل میں ترمیم کریں',
    personalInformation: 'ذاتی معلومات',
    years: 'سال',
    yearsOld: 'سال کا',
    
    // My Reviews Screen
    reviewStatistics: 'جائزے کی تفصیلات',
    totalReviews: 'کل جائزے',
    averageRating: 'اوسط ریٹنگ',
    totalLikes: 'کل پسند',
    yourReviews: 'آپ کے جائزے',
    deleteReview: 'جائزہ حذف کریں',
    deleteReviewConfirmation: 'کیا آپ واقعی اپنا جائزہ حذف کرنا چاہتے ہیں',
    reviewDeletedSuccessfully: 'جائزہ کامیابی سے حذف ہو گیا',
    failedToDeleteReview: 'جائزہ حذف کرنے میں ناکام',
    editReviewFeature: 'جائزہ ایڈٹ کی سہولت جلد آ رہی ہے',
    noReviewsYet: 'ابھی تک کوئی جائزہ نہیں',
    startWritingReviews: 'اپنے تجربات شیئر کرنے کے لیے جائزے لکھنا شروع کریں',
    explorePlaces: 'جگہیں دریافت کریں',
    loginToViewReviews: 'اپنے جائزے دیکھنے کے لیے براہ کرم لاگ ان کریں',
    loadingReviews: 'جائزے لوڈ ہو رہے ہیں...',
  },
  
  hi: {
    // App Name
    appName: 'मौकिफ',
    appSubtitle: 'आपके नमाज़ स्थानों का केंद्र',
    
    // Navigation
    home: 'होम',
    map: 'मैप',
    add: 'जोड़ें',
    browse: 'ब्राउज़',
    theme: 'थीम',
    language: 'भाषा',
    profile: 'प्रोफाइल',
    host: 'होस्ट',
    notifications: 'सूचनाएं',
    placeDetails: 'स्थान विवरण',
    
    // Home Screen
    findingLocation: 'आपका स्थान खोज रहे हैं...',
    noPrayerSpaces: 'कोई नमाज़ स्थान नहीं मिला',
    noPlacesInArea: 'आपके क्षेत्र में कोई स्थान नहीं मिला।',
    noPlacesWithinRadius: 'आपके स्थान से {radius} किमी के भीतर कोई स्थान नहीं मिला।',
    tapAddPlace: 'इस क्षेत्र में नमाज़ स्थान जोड़ने के लिए नीचे "स्थान जोड़ें" पर टैप करें।',
    unableToLoad: 'स्थान लोड करने में असमर्थ',
    tryAgain: 'फिर कोशिश करें',
    refresh: 'रिफ्रेश',
    showing: 'दिखा रहे हैं',
    of: 'में से',
    places: 'स्थान',
    
    // Search
    searchPlaceholder: 'शहर, मस्जिद, पता खोजें...',
    
    // Place Card
    capacity: 'क्षमता',
    imageUnavailable: 'छवि उपलब्ध नहीं',
    
    // Add Place Screen
    helpFellowMuslims: 'अपने क्षेत्र में नमाज़ स्थान जोड़कर साथी मुसलमानों की मदद करें।',
    placeName: 'स्थान का नाम',
    required: 'आवश्यक',
    enterPlaceName: 'स्थान का नाम दर्ज करें (जैसे: अल-नूर मस्जिद)',
    address: 'पता',
    enterFullAddress: 'पूरा पता दर्ज करें (जैसे: 123 मेन स्ट्रीट, अंधेरी वेस्ट)',
    typeOfPlace: 'स्थान का प्रकार',
    city: 'शहर',
    enterCity: 'जैसे: मुंबई, दिल्ली',
    capacityOptional: 'क्षमता (वैकल्पिक)',
    enterCapacity: 'जैसे: 50',
    contactInformation: 'संपर्क जानकारी (वैकल्पिक)',
    phoneNumber: 'फोन नंबर',
    enterPhone: 'जैसे: +91 9876543210',
    whatsappNumber: 'व्हाट्सऐप नंबर',
    availableAmenities: 'उपलब्ध सुविधाएं',
    wuzu: 'वुज़ू',
    washroom: 'वॉशरूम',
    women_area: 'महिला क्षेत्र',
    photo: 'फोटो',
    addPhoto: 'फोटो जोड़ें',
    photoRequired: 'फोटो आवश्यक है',
    addingPlace: 'स्थान जोड़ रहे हैं...',
    addPrayerSpace: 'नमाज़ स्थान जोड़ें',
    
    // Place Types
    masjid: 'मस्जिद',
    musalla: 'मुसल्ला',
    community: 'कम्युनिटी सेंटर',
    outdoor: 'बाहरी स्थान',
    home: 'घर',
    office: 'कार्यालय',
    shop: 'दुकान',
    other: 'अन्य',
    
    // Theme Screen
    chooseTheme: 'थीम चुनें',
    selectPreferredAppearance: 'अपनी पसंदीदा दिखावट चुनें',
    lightMode: 'लाइट मोड',
    lightModeDesc: 'दिन के समय उपयोग के लिए साफ और उज्ज्वल इंटरफेस',
    darkMode: 'डार्क मोड',
    darkModeDesc: 'कम रोशनी वाले वातावरण में आंखों के लिए आसान',
    themeChangesInstant: 'थीम परिवर्तन तुरंत पूरे ऐप में लागू होते हैं',
    
    // Language Screen
    chooseLanguage: 'भाषा चुनें',
    selectPreferredLanguage: 'अपनी पसंदीदा भाषा चुनें',
    languageChangesInstant: 'भाषा परिवर्तन तुरंत पूरे ऐप में लागू होते हैं',
    
    // Filter Modal
    filters: 'फिल्टर',
    reset: 'रीसेट',
    placeAdded: 'स्थान जोड़ा गया',
    minimumRating: 'न्यूनतम रेटिंग',
    womenAreaFilter: 'महिला क्षेत्र',
    searchRadius: 'खोज त्रिज्या',
    typeOfPlaceFilter: 'स्थान का प्रकार',
    applyFilters: 'फिल्टर लागू करें',
    yes: 'हां',
    no: 'नहीं',
    
    // Time filters
    lastHour: 'पिछला घंटा',
    lastDay: 'पिछला दिन',
    lastWeek: 'पिछला सप्ताह',
    lastMonth: 'पिछला महीना',
    
    // Common
    success: 'सफलता',
    error: 'त्रुटि',
    cancel: 'रद्द करें',
    ok: 'ठीक है',
    back: 'वापस',
    next: 'अगला',
    save: 'सेव करें',
    delete: 'डिलीट करें',
    edit: 'संपादित करें',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    
    // Reviews
    review: 'समीक्षा',
    reviews: 'समीक्षाएं',
    noReviewsYet: 'अभी तक कोई समीक्षा नहीं',
    userReviews: 'उपयोगकर्ता समीक्षाएं',
    writeReview: 'समीक्षा लिखें',
    reviewRules: 'समीक्षा पोस्ट करने से पहले कृपया नियम पढ़ें और लागू करें।',
    reviewTerms: 'अपनी समीक्षा साझा करके, आप सभी संबंधित शर्तों से सहमत हैं।',
    newest: 'नवीनतम',
    mostLiked: 'सबसे पसंदीदा',
    oldest: 'पुरानी',
    noReviewsMessage: 'इस स्थान के बारे में अपना अनुभव साझा करने वाले पहले बनें!',
    
    // Contact & Actions
    contactInformation: 'संपर्क जानकारी:',
    call: 'कॉल',
    notProvided: 'प्रदान नहीं किया गया',
    whatsapp: 'व्हाट्सऐप',
    getDirections: 'दिशा प्राप्त करें',
    
    // Review Modal
    writeAReview: 'समीक्षा लिखें',
    post: 'पोस्ट',
    howWouldYouRate: 'आप इस स्थान को कैसे रेट करेंगे?',
    tapStarsToRate: 'अपनी रेटिंग चुनने के लिए सितारों पर टैप करें',
    shareYourExperience: 'अपना अनुभव साझा करें',
    tellOthersAboutVisit: 'दूसरों को अपनी यात्रा के बारे में बताएं',
    shareExperiencePlaceholder: 'इस स्थान के बारे में अपना अनुभव साझा करें...',
    charactersCount: 'अक्षर',
    tipsForGreatReview: '💡 बेहतरीन समीक्षा के लिए सुझाव:',
    tipBeSpecific: '• अपने अनुभव के बारे में विशिष्ट बनें',
    tipMentionLikes: '• बताएं कि आपको क्या पसंद आया या नहीं आया',
    tipHelpOthers: '• दूसरों को सूचित निर्णय लेने में मदद करें',
    tipKeepRespectful: '• इसे सम्मानजनक और ईमानदार रखें',
    writeFirstReview: 'पहली समीक्षा लिखें',
    reply: 'जवाब',
    report: 'रिपोर्ट',
    
    // Validation Messages
    titleRequired: 'स्थान का नाम आवश्यक है',
    addressRequired: 'पता आवश्यक है',
    cityRequired: 'शहर आवश्यक है',
    locationRequired: 'स्थान आवश्यक है',
    
    // Success Messages
    placeAddedSuccess: 'नमाज़ स्थान सफलतापूर्वक जोड़ा गया!',
    viewPlaces: 'स्थान देखें',
    
    // Error Messages
    locationPermissionRequired: 'नजदीकी नमाज़ स्थान खोजने के लिए स्थान अनुमति आवश्यक है',
    unableToGetLocation: 'आपका स्थान प्राप्त करने में असमर्थ। कृपया अपनी GPS सेटिंग्स जांचें।',
    noInternetConnection: 'स्थान लोड करने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन जांचें और फिर कोशिश करें।',
    
    // Profile Screen
    profileInformation: 'प्रोफाइल जानकारी',
    fullName: 'पूरा नाम',
    age: 'उम्र',
    gender: 'लिंग',
    memberSince: 'सदस्य कब से',
    notProvided: 'प्रदान नहीं किया गया',
    updateProfile: 'प्रोफाइल अपडेट करें',
    signOut: 'साइन आउट',
    
    // Profile Menu Items
    myPlaces: 'मेरे स्थान',
    placesYouAdded: 'आपके द्वारा जोड़े गए स्थान',
    myReviews: 'मेरी समीक्षाएं',
    reviewsYouWrote: 'आपकी लिखी गई समीक्षाएं',
    favorites: 'पसंदीदा',
    savedPlaces: 'आपके सहेजे गए स्थान',
    darkLightMode: 'डार्क/लाइट मोड',
    changeLanguage: 'ऐप भाषा बदलें',
    offlineCache: 'ऑफलाइन कैश',
    manageOfflineData: 'ऑफलाइन डेटा प्रबंधित करें',
    
    // Profile States
    guestUser: 'अतिथि उपयोगकर्ता',
    notLoggedIn: 'लॉग इन नहीं',
    verified: 'सत्यापित',
    phoneNotProvided: 'फोन प्रदान नहीं किया गया',
    
    // Profile Actions
    logout: 'लॉगआउट',
    logoutConfirmation: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
    loggedOutSuccessfully: 'सफलतापूर्वक लॉगआउट हो गए',
    
    // Settings
    settings: 'सेटिंग्स',
    account: 'खाता',
    pushNotifications: 'पुश नोटिफिकेशन',
    locationServices: 'लोकेशन सेवाएं',
    enableLocationAccess: 'लोकेशन एक्सेस सक्षम करें',
    
    // Coming Soon Features
    comingSoon: 'जल्द आ रहा है',
    myPlacesFeature: 'मेरे स्थान सुविधा जल्द उपलब्ध होगी',
    myReviewsFeature: 'मेरी समीक्षाएं सुविधा जल्द उपलब्ध होगी',
    favoritesFeature: 'पसंदीदा सुविधा जल्द उपलब्ध होगी',
    editProfileFeature: 'प्रोफाइल संपादित करें सुविधा जल्द उपलब्ध होगी',
    
    // App Info
    appDescription: 'अपने पास नमाज़ स्थान खोजें और नए स्थान साझा करके समुदाय की मदद करें',
    
    // Bookmarks
    bookmarks: 'बुकमार्क',
    myBookmarks: 'मेरे बुकमार्क',
    yourSavedPlaces: 'आपके सहेजे गए स्थान',
    bookmarkAdded: 'स्थान सफलतापूर्वक बुकमार्क किया गया!',
    bookmarkRemoved: 'बुकमार्क सफलतापूर्वक हटाया गया!',
    removeBookmark: 'बुकमार्क हटाएं',
    removeBookmarkConfirmation: 'क्या आप वाकई बुकमार्क हटाना चाहते हैं',
    bookmarkRemovedSuccessfully: 'बुकमार्क सफलतापूर्वक हटाया गया',
    failedToRemoveBookmark: 'बुकमार्क हटाने में विफल',
    failedToUpdateBookmark: 'बुकमार्क अपडेट करने में विफल',
    loginRequiredForBookmarks: 'स्थानों को बुकमार्क करने और अपने सहेजे गए स्थानों तक पहुंचने के लिए कृपया लॉगिन करें।',
    loginToViewBookmarks: 'अपने बुकमार्क देखने के लिए कृपया लॉगिन करें',
    loadingBookmarks: 'बुकमार्क लोड हो रहे हैं...',
    bookmarkStatistics: 'बुकमार्क आंकड़े',
    totalBookmarks: 'कुल बुकमार्क',
    byType: 'प्रकार के अनुसार',
    bookmarkedOn: 'बुकमार्क किया गया',
    remove: 'हटाएं',
    placesAdded: 'जोड़े गए स्थान',
    info: 'जानकारी',
    noBookmarksYet: 'अभी तक कोई बुकमार्क नहीं',
    startBookmarking: 'बाद में जाने के लिए स्थानों को बुकमार्क करना शुरू करें',
    noReviewsYetProfile: 'अभी तक कोई समीक्षा नहीं',
    shareExperiences: 'समीक्षा लिखकर अपने अनुभव साझा करें',
    loadingProfile: 'प्रोफाइल लोड हो रहा है...',
    profileImageUpdated: 'प्रोफाइल इमेज सफलतापूर्वक अपडेट हो गई!',
    profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट हो गया!',
    signOutConfirm: 'क्या आप वाकई साइन आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    saveChanges: 'परिवर्तन सहेजें',
    enterFullName: 'अपना पूरा नाम दर्ज करें',
    enterEmail: 'अपना ईमेल दर्ज करें',
    enterAge: 'अपनी उम्र दर्ज करें',
    enterGender: 'अपना लिंग दर्ज करें',
    enterCity: 'अपना शहर दर्ज करें',
    selectImage: 'इमेज चुनें',
    camera: 'कैमरा',
    gallery: 'गैलरी',
    permissionRequired: 'अनुमति आवश्यक',
    cameraPermissionRequired: 'फोटो लेने के लिए कृपया कैमरा अनुमति दें।',
    galleryPermissionRequired: 'इमेज अपलोड करने के लिए कृपया कैमरा रोल अनुमति दें।',
    failedToUploadImage: 'इमेज अपलोड करने में विफल। कृपया फिर कोशिश करें।',
    failedToOpenCamera: 'कैमरा खोलने में विफल',
    failedToOpenGallery: 'गैलरी खोलने में विफल',
    active: 'सक्रिय',
    likes: 'पसंद',
    
    // Login & Authentication
    loginRequired: 'लॉगिन आवश्यक',
    loginRequiredMessage: 'दिशा और प्रीमियम सुविधाओं तक पहुंचने के लिए कृपया अपने फोन नंबर से लॉगिन करें।',
    login: 'लॉगिन',
    welcomeToMawqif: 'मौकिफ में आपका स्वागत है',
    enterPhoneForPremium: 'प्रीमियम सुविधाओं तक पहुंचने के लिए अपना फोन नंबर दर्ज करें',
    phoneNumber: 'फोन नंबर',
    enterMobileNumber: '10-अंकीय मोबाइल नंबर दर्ज करें',
    premiumFeatures: 'प्रीमियम सुविधाएं:',
    uploadPlaceImages: 'स्थान की छवियां अपलोड करें',
    addReviewsRatings: 'समीक्षा और रेटिंग जोड़ें',
    bookmarkFavorites: 'पसंदीदा स्थानों को बुकमार्क करें',
    listYourPlaces: 'अपने स्थानों की सूची बनाएं',
    sendOTP: 'OTP भेजें',
    verifyOTP: 'OTP सत्यापित करें',
    enterOTPSent: 'भेजा गया 6-अंकीय कोड दर्ज करें',
    otpCode: 'OTP कोड',
    enter6DigitOTP: '6-अंकीय OTP दर्ज करें',
    resendOTPIn: 'OTP फिर से भेजें',
    seconds: 'सेकंड में',
    resendOTP: 'OTP फिर से भेजें',
    verifyAndLogin: 'सत्यापित करें और लॉगिन करें',
    changePhoneNumber: 'फोन नंबर बदलें',
    loginSuccessful: 'लॉगिन सफल!',
    continue: 'जारी रखें',
    invalidPhoneNumber: 'अमान्य फोन नंबर',
    validMobileNumberRequired: 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
    invalidOTP: 'अमान्य OTP',
    valid6DigitOTPRequired: 'कृपया मान्य 6-अंकीय OTP दर्ज करें',
    verificationFailed: 'सत्यापन विफल',
    
    // User Profile Data
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    dateOfBirth: 'जन्म तिथि',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    enterFirstName: 'अपना पहला नाम दर्ज करें',
    enterLastName: 'अपना अंतिम नाम दर्ज करें',
    selectDateOfBirth: 'अपनी जन्म तिथि चुनें',
    selectGender: 'अपना लिंग चुनें',
    profileCompleted: 'प्रोफाइल सफलतापूर्वक पूर्ण हो गया!',
    profileCompletionRequired: 'कृपया अपना प्रोफाइल पूरा करें',
    completeProfile: 'प्रोफाइल पूरा करें',
    editProfile: 'प्रोफाइल संपादित करें',
    personalInformation: 'व्यक्तिगत जानकारी',
    years: 'वर्ष',
    yearsOld: 'वर्ष का',
    
    // My Reviews Screen
    reviewStatistics: 'समीक्षा आंकड़े',
    totalReviews: 'कुल समीक्षाएं',
    averageRating: 'औसत रेटिंग',
    totalLikes: 'कुल पसंद',
    yourReviews: 'आपकी समीक्षाएं',
    deleteReview: 'समीक्षा हटाएं',
    deleteReviewConfirmation: 'क्या आप वाकई अपनी समीक्षा हटाना चाहते हैं',
    reviewDeletedSuccessfully: 'समीक्षा सफलतापूर्वक हटा दी गई',
    failedToDeleteReview: 'समीक्षा हटाने में विफल',
    editReviewFeature: 'समीक्षा संपादित करें सुविधा जल्द आ रही है',
    noReviewsYet: 'अभी तक कोई समीक्षा नहीं',
    startWritingReviews: 'अपने अनुभव साझा करने के लिए समीक्षा लिखना शुरू करें',
    explorePlaces: 'स्थान एक्सप्लोर करें',
    loginToViewReviews: 'अपनी समीक्षाएं देखने के लिए कृपया लॉगिन करें',
    loadingReviews: 'समीक्षाएं लोड हो रही हैं...',
  },
};

// Language information
export const languages = [
  { code: 'en' as LanguageCode, name: 'English', nativeName: 'English' },
  { code: 'mr' as LanguageCode, name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ur' as LanguageCode, name: 'Urdu', nativeName: 'اردو' },
  { code: 'hi' as LanguageCode, name: 'Hindi', nativeName: 'हिन्दी' },
];

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load saved language on app start
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && ['en', 'mr', 'ur', 'hi'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.log('Error loading saved language:', error);
    }
  };

  const saveLanguage = async (newLanguage: LanguageCode) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const setLanguage = (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    saveLanguage(newLanguage);
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in English either
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Check if current language is RTL
  const isRTL = language === 'ur';

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};