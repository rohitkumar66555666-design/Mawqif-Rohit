import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePhoneVerification } from '../lib/authStore';
import { sendOTP, getDevModeOTP, USE_FIREBASE, showOTPFeedback, getUnifiedErrorMessage } from '../lib/firebaseConfig';
import { getResponsiveDimensions, rs, rf } from '../utils/responsive';

interface PhoneInputComponentProps {
  onOTPSent: () => void;
}

export const PhoneInputComponent: React.FC<PhoneInputComponentProps> = ({ onOTPSent }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const phoneInputRef = useRef<PhoneInput>(null);
  
  const {
    phoneNumber,
    isLoading,
    error,
    setPhoneNumber,
    setLoading,
    setError,
    setConfirmationResult,
    setOtpSent,
    setResendTimer,
  } = usePhoneVerification();
  
  const [formattedValue, setFormattedValue] = useState('');
  const [valid, setValid] = useState(false);

  // Validate Indian phone number
  const validatePhoneNumber = (number: string): boolean => {
    // Remove country code and spaces
    const cleanNumber = number.replace(/^\+91\s?/, '').replace(/\s/g, '');
    // Indian mobile numbers: 10 digits starting with 6-9
    return /^[6-9]\d{9}$/.test(cleanNumber);
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!valid || !phoneNumber) {
      setError('Please enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format phone number with country code
      const fullPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber.replace(/^\+91\s?/, '')}`;

      console.log('📱 Sending OTP to:', fullPhoneNumber);

      // Send OTP using Firebase or mock
      const confirmationResult = await sendOTP(fullPhoneNumber);
      
      // Store confirmation result
      setConfirmationResult(confirmationResult);
      setOtpSent(true);
      
      // Start resend timer
      startResendTimer();
      
      // Vibrate on success
      Vibration.vibrate(100);
      
      // Show unified OTP feedback (different for each mode)
      showOTPFeedback(fullPhoneNumber, true);
      
      // Navigate to OTP screen
      onOTPSent();
      
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      setError(getUnifiedErrorMessage(error));
      Vibration.vibrate([100, 100, 100]); // Error vibration pattern
    } finally {
      setLoading(false);
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rs(24),
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      marginBottom: rs(40),
    },
    logo: {
      width: rs(80),
      height: rs(80),
      borderRadius: rs(40),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: rs(20),
    },
    title: {
      fontSize: rf(28),
      fontWeight: '700',
      color: colors.text,
      marginBottom: rs(8),
      textAlign: 'center',
    },
    subtitle: {
      fontSize: rf(16),
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: rf(22),
      paddingHorizontal: rs(20),
    },
    form: {
      marginBottom: rs(32),
    },
    inputContainer: {
      marginBottom: rs(24),
    },
    label: {
      fontSize: rf(16),
      fontWeight: '600',
      color: colors.text,
      marginBottom: rs(12),
    },
    phoneInputContainer: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: rs(16),
      backgroundColor: colors.surface,
      paddingHorizontal: rs(4),
    },
    phoneInputContainerFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: rs(8),
      elevation: 4,
    },
    phoneInput: {
      fontSize: rf(16),
      color: colors.text,
    },
    sendButton: {
      backgroundColor: colors.primary,
      paddingVertical: rs(18),
      borderRadius: rs(16),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: rs(4) },
      shadowOpacity: 0.3,
      shadowRadius: rs(8),
    },
    sendButtonDisabled: {
      backgroundColor: colors.textSecondary,
      elevation: 0,
      shadowOpacity: 0,
    },
    sendButtonText: {
      color: colors.textInverse,
      fontSize: rf(18),
      fontWeight: '700',
      marginLeft: rs(8),
    },
    errorContainer: {
      marginTop: rs(16),
      padding: rs(12),
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: rs(12),
      borderLeftWidth: rs(4),
      borderLeftColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: rf(14),
      fontWeight: '500',
    },
    devModeIndicator: {
      position: 'absolute',
      top: rs(50),
      right: rs(20),
      backgroundColor: 'rgba(255, 152, 0, 0.9)',
      paddingHorizontal: rs(12),
      paddingVertical: rs(6),
      borderRadius: rs(20),
    },
    devModeText: {
      color: 'white',
      fontSize: rf(12),
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Dev Mode Indicator */}
      {!USE_FIREBASE && (
        <View style={styles.devModeIndicator}>
          <Text style={styles.devModeText}>DEV MODE</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <MaterialIcons name="mosque" size={rf(40)} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>{t('welcomeToMawqif')}</Text>
        <Text style={styles.subtitle}>
          Enter your phone number to get started with prayer space discovery
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('phoneNumber')}</Text>
          <View style={[
            styles.phoneInputContainer,
            valid && styles.phoneInputContainerFocused
          ]}>
            <PhoneInput
              ref={phoneInputRef}
              defaultValue={phoneNumber}
              defaultCode="IN"
              layout="first"
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError(null);
              }}
              onChangeFormattedText={(text) => {
                setFormattedValue(text);
                const isValid = validatePhoneNumber(text);
                setValid(isValid);
              }}
              countryPickerProps={{ withAlphaFilter: true }}
              disabled={isLoading}
              withDarkTheme={false}
              withShadow={false}
              autoFocus={true}
              textContainerStyle={{
                backgroundColor: 'transparent',
                paddingVertical: rs(16),
              }}
              textInputStyle={styles.phoneInput}
              codeTextStyle={styles.phoneInput}
              flagButtonStyle={{
                paddingHorizontal: rs(12),
              }}
            />
          </View>
        </View>

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!valid || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendOTP}
          disabled={!valid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <MaterialIcons name="send" size={rf(20)} color={colors.textInverse} />
          )}
          <Text style={styles.sendButtonText}>
            {isLoading ? 'Sending...' : t('sendOTP')}
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
};