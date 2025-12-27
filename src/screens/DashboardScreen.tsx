import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, useAuthStore } from '../lib/authStore';
import { signOut } from '../lib/firebaseConfig';
import { getResponsiveDimensions, rs, rf } from '../utils/responsive';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { logout } = useAuthStore();

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              logout();
              navigation.navigate('Main');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: rs(24),
    },
    header: {
      alignItems: 'center',
      marginBottom: rs(40),
      marginTop: rs(60),
    },
    welcomeIcon: {
      width: rs(100),
      height: rs(100),
      borderRadius: rs(50),
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
    },
    userInfo: {
      backgroundColor: colors.surface,
      borderRadius: rs(16),
      padding: rs(20),
      marginBottom: rs(32),
      borderWidth: 1,
      borderColor: colors.border,
    },
    userInfoTitle: {
      fontSize: rf(18),
      fontWeight: '600',
      color: colors.text,
      marginBottom: rs(16),
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: rs(12),
    },
    userInfoLabel: {
      fontSize: rf(14),
      color: colors.textSecondary,
      marginLeft: rs(12),
      flex: 1,
    },
    userInfoValue: {
      fontSize: rf(14),
      fontWeight: '500',
      color: colors.text,
    },
    actions: {
      gap: rs(16),
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: rs(16),
      borderRadius: rs(12),
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionButtonDanger: {
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: colors.error,
    },
    actionButtonIcon: {
      marginRight: rs(12),
    },
    actionButtonText: {
      fontSize: rf(16),
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    actionButtonTextPrimary: {
      color: colors.textInverse,
    },
    actionButtonTextDanger: {
      color: colors.error,
    },
    actionButtonChevron: {
      marginLeft: rs(8),
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeIcon}>
          <MaterialIcons name="check-circle" size={rf(50)} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>Welcome back! 🎉</Text>
        <Text style={styles.subtitle}>
          You're successfully logged in to {t('appName')}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userInfoTitle}>Account Information</Text>
        
        <View style={styles.userInfoRow}>
          <MaterialIcons name="phone" size={rf(20)} color={colors.primary} />
          <Text style={styles.userInfoLabel}>Phone Number</Text>
          <Text style={styles.userInfoValue}>{user?.phoneNumber || 'Not provided'}</Text>
        </View>
        
        <View style={styles.userInfoRow}>
          <MaterialIcons name="person" size={rf(20)} color={colors.primary} />
          <Text style={styles.userInfoLabel}>User ID</Text>
          <Text style={styles.userInfoValue}>{user?.uid?.slice(0, 8)}...</Text>
        </View>
        
        <View style={styles.userInfoRow}>
          <MaterialIcons name="access-time" size={rf(20)} color={colors.primary} />
          <Text style={styles.userInfoLabel}>Status</Text>
          <Text style={styles.userInfoValue}>Verified ✅</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="explore" 
            size={rf(24)} 
            color={colors.textInverse} 
            style={styles.actionButtonIcon}
          />
          <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
            Explore Prayer Spaces
          </Text>
          <MaterialIcons 
            name="chevron-right" 
            size={rf(20)} 
            color={colors.textInverse}
            style={styles.actionButtonChevron}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Theme')}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="palette" 
            size={rf(24)} 
            color={colors.primary} 
            style={styles.actionButtonIcon}
          />
          <Text style={styles.actionButtonText}>App Settings</Text>
          <MaterialIcons 
            name="chevron-right" 
            size={rf(20)} 
            color={colors.textSecondary}
            style={styles.actionButtonChevron}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="logout" 
            size={rf(24)} 
            color={colors.error} 
            style={styles.actionButtonIcon}
          />
          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
            Sign Out
          </Text>
          <MaterialIcons 
            name="chevron-right" 
            size={rf(20)} 
            color={colors.error}
            style={styles.actionButtonChevron}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};