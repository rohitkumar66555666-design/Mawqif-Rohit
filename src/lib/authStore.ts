import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfileService } from '../services/user-profile.service';

// ============================================
// AUTH STORE TYPES
// ============================================

interface User {
  uid: string;
  phoneNumber: string;
  displayName?: string | null;
  email?: string | null;
}

interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  
  // Phone verification flow
  phoneNumber: string;
  verificationId: string | null;
  confirmationResult: any | null;
  
  // UI states
  isLoading: boolean;
  error: string | null;
  
  // OTP states
  otpSent: boolean;
  resendTimer: number;
  
  // Actions
  setPhoneNumber: (phone: string) => void;
  setVerificationId: (id: string) => void;
  setConfirmationResult: (result: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOtpSent: (sent: boolean) => void;
  setResendTimer: (timer: number) => void;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  user: null,
  isAuthenticated: false,
  phoneNumber: '',
  verificationId: null,
  confirmationResult: null,
  isLoading: false,
  error: null,
  otpSent: false,
  resendTimer: 0,
};

// ============================================
// AUTH STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Set phone number
      setPhoneNumber: (phone: string) => {
        set({ phoneNumber: phone, error: null });
      },
      
      // Set verification ID (Firebase)
      setVerificationId: (id: string) => {
        set({ verificationId: id });
      },
      
      // Set confirmation result (Firebase)
      setConfirmationResult: (result: any) => {
        set({ confirmationResult: result });
      },
      
      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      // Set error message
      setError: (error: string | null) => {
        set({ error });
      },
      
      // Set OTP sent status
      setOtpSent: (sent: boolean) => {
        set({ otpSent: sent });
      },
      
      // Set resend timer
      setResendTimer: (timer: number) => {
        set({ resendTimer: timer });
      },
      
      // Set user data
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
      
      // Login user
      login: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null,
          isLoading: false
        });
        console.log('✅ User logged in:', user.phoneNumber);
        
        // Update last login time in profile (don't await to avoid blocking)
        UserProfileService.updateLastLogin(user.uid).catch(error => {
          console.log('⚠️ Failed to update last login:', error);
        });
      },
      
      // Logout user
      logout: () => {
        set({
          ...initialState,
          isAuthenticated: false
        });
        console.log('🚪 User logged out');
      },
      
      // Reset auth state
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'mawqif-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data and authentication status
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// HELPER HOOKS
// ============================================

// Hook to get authentication status
export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
};

// Hook to get phone verification state
export const usePhoneVerification = () => {
  const {
    phoneNumber,
    verificationId,
    confirmationResult,
    otpSent,
    resendTimer,
    error,
    isLoading,
    setPhoneNumber,
    setVerificationId,
    setConfirmationResult,
    setOtpSent,
    setResendTimer,
    setError,
    setLoading,
  } = useAuthStore();
  
  return {
    phoneNumber,
    verificationId,
    confirmationResult,
    otpSent,
    resendTimer,
    error,
    isLoading,
    setPhoneNumber,
    setVerificationId,
    setConfirmationResult,
    setOtpSent,
    setResendTimer,
    setError,
    setLoading,
  };
};