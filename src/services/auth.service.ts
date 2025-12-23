// ============================================
// AUTHENTICATION SERVICE
// Handles all authentication related operations
// ============================================

import { supabase } from './supabase';

// Interface for user data structure
export interface User {
  id: string;
  phone_number: string;
  name?: string;
  email?: string;
  is_verified: boolean;
  created_at: string;
}

// Interface for OTP verification data
export interface OTPVerification {
  phone_number: string;
  otp_code: string;
  expires_at: string;
}

class AuthService {
  
  // ============================================
  // SEND OTP TO PHONE NUMBER
  // Generates 4-digit OTP and stores in database
  // ============================================
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Generate 4-digit OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Set expiry time (5 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      // Store OTP in database
      const { error } = await supabase
        .from('otp_verifications')
        .insert({
          phone_number: phoneNumber,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          is_used: false
        });
      
      if (error) {
        console.error('❌ Error storing OTP:', error);
        return { success: false, message: 'Failed to send OTP' };
      }
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, we'll log the OTP for testing
      console.log('🔐 Generated OTP:', otpCode);
      console.log('⏰ Expires at:', expiresAt);
      
      return { 
        success: true, 
        message: `OTP sent to ${phoneNumber}. Code: ${otpCode}` // Remove this in production
      };
      
    } catch (error) {
      console.error('❌ Error in sendOTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }
  
  // ============================================
  // VERIFY OTP AND LOGIN USER
  // Checks OTP validity and creates/updates user
  // ============================================
  async verifyOTP(phoneNumber: string, otpCode: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      console.log('🔐 Verifying OTP for:', phoneNumber);
      
      // Find valid OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (otpError || !otpData || otpData.length === 0) {
        console.error('❌ Invalid or expired OTP');
        return { success: false, message: 'Invalid or expired OTP' };
      }
      
      // Mark OTP as used
      await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('id', otpData[0].id);
      
      // Check if user exists
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      // If user doesn't exist, create new user
      if (userError && userError.code === 'PGRST116') {
        console.log('👤 Creating new user');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone_number: phoneNumber,
            is_verified: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating user:', createError);
          return { success: false, message: 'Failed to create user account' };
        }
        
        userData = newUser;
      } else if (userError) {
        console.error('❌ Error fetching user:', userError);
        return { success: false, message: 'Failed to verify user' };
      } else {
        // Update existing user as verified
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', userData.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          return { success: false, message: 'Failed to update user' };
        }
        
        userData = updatedUser;
      }
      
      console.log('✅ User verified successfully:', userData);
      return { 
        success: true, 
        user: userData as User, 
        message: 'Login successful' 
      };
      
    } catch (error) {
      console.error('❌ Error in verifyOTP:', error);
      return { success: false, message: 'Verification failed' };
    }
  }
  
  // ============================================
  // UPDATE USER PROFILE
  // Updates user name and email
  // ============================================
  async updateProfile(userId: string, name: string, email?: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      console.log('👤 Updating profile for user:', userId);
      
      const updateData: any = { name };
      if (email) updateData.email = email;
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating profile:', error);
        return { success: false, message: 'Failed to update profile' };
      }
      
      console.log('✅ Profile updated successfully');
      return { 
        success: true, 
        user: data as User, 
        message: 'Profile updated successfully' 
      };
      
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }
  
  // ============================================
  // GET USER BY ID
  // Retrieves user information
  // ============================================
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user:', error);
        return null;
      }
      
      return data as User;
    } catch (error) {
      console.error('❌ Error in getUser:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();