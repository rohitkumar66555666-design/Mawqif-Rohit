// ============================================
// AUTHENTICATION CONTEXT
// Manages global authentication state
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, authService } from '../services/auth.service';

// Interface for authentication context
interface AuthContextType {
  // Current user state
  user: User | null;
  
  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (phoneNumber: string, otpCode: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (name: string, email?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  USER: '@mawqif_user',
  IS_AUTHENTICATED: '@mawqif_authenticated'
};

// ============================================
// AUTHENTICATION PROVIDER COMPONENT
// Wraps the app and provides auth state
// ============================================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ============================================
  // INITIALIZE AUTHENTICATION STATE
  // Checks if user is already logged in
  // ============================================
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing authentication...');
      
      // Check if user data exists in storage
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedAuth = await AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
      
      if (storedUser && storedAuth === 'true') {
        const userData = JSON.parse(storedUser);
        
        // Verify user still exists in database
        const currentUser = await authService.getUser(userData.id);
        
        if (currentUser && currentUser.is_verified) {
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('✅ User restored from storage:', currentUser.phone_number);
        } else {
          // Clear invalid stored data
          await clearStoredAuth();
          console.log('❌ Stored user data is invalid, cleared');
        }
      }
      
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };
  
  // ============================================
  // CLEAR STORED AUTHENTICATION DATA
  // Helper function to clear AsyncStorage
  // ============================================
  const clearStoredAuth = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.IS_AUTHENTICATED]);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Error clearing stored auth:', error);
    }
  };
  
  // ============================================
  // STORE AUTHENTICATION DATA
  // Helper function to save to AsyncStorage
  // ============================================
  const storeAuthData = async (userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
    }
  };
  
  // ============================================
  // SEND OTP FUNCTION
  // Wrapper for auth service sendOTP
  // ============================================
  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📱 Sending OTP via context...');
      return await authService.sendOTP(phoneNumber);
    } catch (error) {
      console.error('❌ Error in context sendOTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  };
  
  // ============================================
  // VERIFY OTP FUNCTION
  // Wrapper for auth service verifyOTP with state management
  // ============================================
  const verifyOTP = async (phoneNumber: string, otpCode: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔐 Verifying OTP via context...');
      
      const result = await authService.verifyOTP(phoneNumber, otpCode);
      
      if (result.success && result.user) {
        // Update context state
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Store in AsyncStorage
        await storeAuthData(result.user);
        
        console.log('✅ User authenticated successfully');
      }
      
      return { success: result.success, message: result.message };
      
    } catch (error) {
      console.error('❌ Error in context verifyOTP:', error);
      return { success: false, message: 'Verification failed' };
    }
  };
  
  // ============================================
  // UPDATE PROFILE FUNCTION
  // Updates user profile and refreshes state
  // ============================================
  const updateProfile = async (name: string, email?: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }
      
      console.log('👤 Updating profile via context...');
      
      const result = await authService.updateProfile(user.id, name, email);
      
      if (result.success && result.user) {
        // Update context state
        setUser(result.user);
        
        // Update stored data
        await storeAuthData(result.user);
        
        console.log('✅ Profile updated successfully');
      }
      
      return { success: result.success, message: result.message };
      
    } catch (error) {
      console.error('❌ Error in context updateProfile:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  };
  
  // ============================================
  // LOGOUT FUNCTION
  // Clears all authentication data
  // ============================================
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out user...');
      
      // Clear stored data
      await clearStoredAuth();
      
      console.log('✅ User logged out successfully');
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };
  
  // Context value object
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    sendOTP,
    verifyOTP,
    updateProfile,
    logout
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK TO USE AUTH CONTEXT
// Provides easy access to authentication state
// ============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};