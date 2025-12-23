// ============================================
// LOGIN SCREEN COMPONENT
// Handles phone number input and OTP verification
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { getResponsiveDimensions, rs, rf } from '../utils/responsive';

// Interface for component props
interface LoginScreenProps {
  navigation: any;
}

// ============================================
// MAIN LOGIN SCREEN COMPONENT
// Manages phone number input and OTP verification flow
// ============================================
export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  
  // ============================================
  // STATE MANAGEMENT
  // Handles all component state
  // ============================================
  
  // Authentication context
  const { sendOTP, verifyOTP } = useAuth();
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone'); // Current step in login flow
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Timer for OTP resend
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Input refs for focus management
  const phoneInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  
  // ============================================
  // PHONE NUMBER VALIDATION
  // Validates Indian phone number format
  // ============================================
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    
    return indianMobileRegex.test(cleanPhone);
  };
  
  // ============================================
  // FORMAT PHONE NUMBER FOR DISPLAY
  // Formats phone number with country code
  // ============================================
  const formatPhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add +91 country code if not present
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }
    
    return phone;
  };
  
  // ============================================
  // HANDLE SEND OTP
  // Sends OTP to the entered phone number
  // ============================================
  const handleSendOTP = async () => {
    try {
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number');
        return;
      }
      
      setIsLoading(true);
      
      // Format phone number with country code
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      console.log('📱 Sending OTP to:', formattedPhone);
      
      // Call auth service to send OTP
      const result = await sendOTP(formattedPhone);
      
      if (result.success) {
        // Move to OTP verification step
        setStep('otp');
        setOtpSent(true);
        
        // Start resend timer (60 seconds)
        startResendTimer();
        
        // Focus on OTP input
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
        
        // Show success message (remove OTP from message in production)
        Alert.alert('OTP Sent', result.message);
        
      } else {
        Alert.alert('Error', result.message);
      }
      
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ============================================
  // HANDLE VERIFY OTP
  // Verifies the entered OTP code
  // ============================================
  const handleVerifyOTP = async () => {
    try {
      // Validate OTP format
      if (otpCode.length !== 4 || !/^\d{4}$/.test(otpCode)) {
        Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP');
        return;
      }
      
      setIsLoading(true);
      
      // Format phone number
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      console.log('🔐 Verifying OTP for:', formattedPhone);
      
      // Call auth service to verify OTP
      const result = await verifyOTP(formattedPhone, otpCode);
      
      if (result.success) {
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Show success message
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'Continue',
            onPress: () => {
              // Navigation will be handled by AuthContext state change
              // The app will automatically redirect to main screens
            }
          }
        ]);
        
      } else {
        Alert.alert('Verification Failed', result.message);
      }
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ============================================
  // START RESEND TIMER
  // Starts countdown timer for OTP resend
  // ============================================
  const startResendTimer = () => {
    setResendTimer(60);
    
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // ============================================
  // HANDLE RESEND OTP
  // Resends OTP after timer expires
  // ============================================
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    // Clear OTP input
    setOtpCode('');
    
    // Resend OTP
    await handleSendOTP();
  };
  
  // ============================================
  // HANDLE BACK TO PHONE
  // Goes back to phone number input
  // ============================================
  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setOtpSent(false);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setResendTimer(0);
    }
    
    // Focus on phone input
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 500);
  };
  
  // ============================================
  // RENDER PHONE NUMBER INPUT STEP
  // Shows phone number input form
  // ============================================
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Welcome to Mawqif</Text>
        <Text style={styles.headerSubtitle}>
          Enter your phone number to access premium features
        </Text>
      </View>
      
      {/* Phone Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.phoneInputWrapper}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            ref={phoneInputRef}
            style={styles.phoneInput}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor={COLORS.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus={true}
          />
        </View>
      </View>
      
      {/* Features List */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Premium Features:</Text>
        <View style={styles.featureItem}>
          <MaterialIcons name="camera-alt" size={rf(24)} color={COLORS.primary} style={styles.featureIcon} />
          <Text style={styles.featureText}>Upload place images</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="star-rate" size={rf(24)} color={COLORS.primary} style={styles.featureIcon} />
          <Text style={styles.featureText}>Add reviews and ratings</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="bookmark-added" size={rf(24)} color={COLORS.primary} style={styles.featureIcon} />
          <Text style={styles.featureText}>Bookmark favorite places</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="business" size={rf(24)} color={COLORS.primary} style={styles.featureIcon} />
          <Text style={styles.featureText}>List your own places</Text>
        </View>
      </View>
      
      {/* Send OTP Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!validatePhoneNumber(phoneNumber) || isLoading) && styles.primaryButtonDisabled
        ]}
        onPress={handleSendOTP}
        disabled={!validatePhoneNumber(phoneNumber) || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.surface} size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // ============================================
  // RENDER OTP VERIFICATION STEP
  // Shows OTP input form
  // ============================================
  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <Text style={styles.headerSubtitle}>
          Enter the 4-digit code sent to {formatPhoneNumber(phoneNumber)}
        </Text>
      </View>
      
      {/* OTP Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>OTP Code</Text>
        <TextInput
          ref={otpInputRef}
          style={styles.otpInput}
          placeholder="Enter 4-digit OTP"
          placeholderTextColor={COLORS.textSecondary}
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
          autoFocus={true}
        />
      </View>
      
      {/* Resend OTP */}
      <View style={styles.resendContainer}>
        {resendTimer > 0 ? (
          <Text style={styles.resendTimer}>
            Resend OTP in {resendTimer} seconds
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP}>
            <Text style={styles.resendButton}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (otpCode.length !== 4 || isLoading) && styles.primaryButtonDisabled
        ]}
        onPress={handleVerifyOTP}
        disabled={otpCode.length !== 4 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.surface} size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify & Login</Text>
        )}
      </TouchableOpacity>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleBackToPhone}
      >
        <Text style={styles.secondaryButtonText}>Change Phone Number</Text>
      </TouchableOpacity>
    </View>
  );
  
  // ============================================
  // MAIN RENDER METHOD
  // Renders the appropriate step
  // ============================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <MaterialIcons name="location-on" size={rf(56)} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>Mawqif</Text>
        </View>
        
        {/* Render current step */}
        {step === 'phone' ? renderPhoneStep() : renderOTPStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ============================================
// STYLES
// All component styles with responsive design
// ============================================
const responsiveDimensions = getResponsiveDimensions();

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Scroll container
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(24),
    paddingVertical: rs(40),
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginBottom: rs(40),
  },
  logoIconContainer: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(12),
  },
  logoText: {
    fontSize: rf(28),
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  // Step container
  stepContainer: {
    width: '100%',
  },
  
  // Header section
  headerContainer: {
    alignItems: 'center',
    marginBottom: rs(32),
  },
  headerTitle: {
    fontSize: rf(24),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: rs(8),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: rf(22),
  },
  
  // Input section
  inputContainer: {
    marginBottom: rs(24),
  },
  inputLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: rs(8),
  },
  
  // Phone input
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: responsiveDimensions.cardBorderRadius,
    backgroundColor: COLORS.surface,
  },
  countryCode: {
    fontSize: rf(16),
    color: COLORS.text,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  phoneInput: {
    flex: 1,
    fontSize: rf(16),
    color: COLORS.text,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    minHeight: responsiveDimensions.inputHeight,
  },
  
  // OTP input
  otpInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: responsiveDimensions.cardBorderRadius,
    backgroundColor: COLORS.surface,
    fontSize: rf(24),
    color: COLORS.text,
    paddingHorizontal: rs(16),
    paddingVertical: rs(20),
    minHeight: responsiveDimensions.inputHeight + rs(20),
    letterSpacing: rs(8),
  },
  
  // Features section
  featuresContainer: {
    marginBottom: rs(32),
  },
  featuresTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: rs(16),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    paddingVertical: rs(4),
  },
  featureIcon: {
    marginRight: rs(12),
    width: rs(24),
  },
  featureText: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
    flex: 1,
  },
  
  // Resend section
  resendContainer: {
    alignItems: 'center',
    marginBottom: rs(24),
  },
  resendTimer: {
    fontSize: rf(14),
    color: COLORS.textSecondary,
  },
  resendButton: {
    fontSize: rf(16),
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: responsiveDimensions.cardBorderRadius,
    paddingVertical: rs(18),
    alignItems: 'center',
    marginBottom: rs(16),
    minHeight: responsiveDimensions.buttonHeight,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: rf(18),
    fontWeight: '600',
    color: COLORS.surface,
  },
  
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: responsiveDimensions.cardBorderRadius,
    paddingVertical: rs(16),
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  secondaryButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: COLORS.text,
  },
});