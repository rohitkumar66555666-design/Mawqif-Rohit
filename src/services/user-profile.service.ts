import { supabase } from './supabase';

export interface UserProfile {
  id?: string;
  user_id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Generated field
  date_of_birth?: string;
  age?: number; // Generated field
  gender?: 'male' | 'female' | 'other';
  city?: string;
  state?: string;
  country?: string;
  profile_image_url?: string;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface CreateUserProfileInput {
  user_id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  state?: string;
  profile_image_url?: string;
}

export interface UpdateUserProfileInput {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  state?: string;
  profile_image_url?: string;
}

export class UserProfileService {
  /**
   * Create a new user profile
   */
  static async createProfile(profileData: CreateUserProfileInput): Promise<UserProfile> {
    try {
      console.log('👤 Creating user profile:', profileData);

      // Calculate full_name and age in application
      const full_name = this.calculateFullName(profileData.first_name, profileData.last_name);
      const age = profileData.date_of_birth ? this.calculateAge(profileData.date_of_birth) : null;

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          user_id: profileData.user_id,
          phone_number: profileData.phone_number,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          full_name: full_name,
          date_of_birth: profileData.date_of_birth,
          age: age,
          gender: profileData.gender,
          city: profileData.city,
          state: profileData.state,
          profile_image_url: profileData.profile_image_url,
          country: 'India', // Default
          is_verified: true, // Since they completed phone verification
          last_login_at: new Date().toISOString(),
        }])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
      }

      console.log('✅ Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createProfile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user_id
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('👤 Getting profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          console.log('ℹ️ No profile found for user:', userId);
          return null;
        }
        console.error('❌ Error getting profile:', error);
        throw error;
      }

      console.log('✅ Profile retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by phone number
   */
  static async getProfileByPhone(phoneNumber: string): Promise<UserProfile | null> {
    try {
      console.log('👤 Getting profile for phone:', phoneNumber);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found for phone:', phoneNumber);
          return null;
        }
        console.error('❌ Error getting profile by phone:', error);
        throw error;
      }

      console.log('✅ Profile retrieved by phone:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getProfileByPhone:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UpdateUserProfileInput): Promise<UserProfile> {
    try {
      console.log('👤 Updating profile for user:', userId, updates);

      // Calculate full_name and age if relevant fields are being updated
      const updateData: any = { ...updates };
      
      // If first_name or last_name is being updated, recalculate full_name
      if (updates.first_name !== undefined || updates.last_name !== undefined) {
        // Get current profile to get missing name parts
        const currentProfile = await this.getProfile(userId);
        const firstName = updates.first_name !== undefined ? updates.first_name : currentProfile?.first_name;
        const lastName = updates.last_name !== undefined ? updates.last_name : currentProfile?.last_name;
        updateData.full_name = this.calculateFullName(firstName, lastName);
      }

      // If date_of_birth is being updated, recalculate age
      if (updates.date_of_birth !== undefined) {
        updateData.age = updates.date_of_birth ? this.calculateAge(updates.date_of_birth) : null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      throw error;
    }
  }

  /**
   * Update profile image
   */
  static async updateProfileImage(userId: string, imageUrl: string): Promise<UserProfile> {
    try {
      console.log('👤 Updating profile image for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating profile image:', error);
        throw error;
      }

      console.log('✅ Profile image updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error in updateProfileImage:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      console.log('👤 Updating last login for user:', userId);

      const { error } = await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating last login:', error);
        // Don't throw error for last login update failure
      } else {
        console.log('✅ Last login updated');
      }
    } catch (error) {
      console.error('❌ Error in updateLastLogin:', error);
      // Don't throw error for last login update failure
    }
  }

  /**
   * Get profile for reviews (public info only)
   */
  static async getProfileForReview(userId: string): Promise<{
    full_name: string;
    profile_image_url?: string;
    city?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, profile_image_url, city')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting profile for review:', error);
      return null;
    }
  }

  /**
   * Search profiles by city (for hosts to see users in their area)
   */
  static async getProfilesByCity(city: string, limit: number = 50): Promise<UserProfile[]> {
    try {
      console.log('👥 Getting profiles for city:', city);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting profiles by city:', error);
        throw error;
      }

      console.log(`✅ Found ${data.length} profiles in ${city}`);
      return data;
    } catch (error) {
      console.error('❌ Error in getProfilesByCity:', error);
      throw error;
    }
  }

  /**
   * Check if profile exists
   */
  static async profileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Error checking if profile exists:', error);
      return false;
    }
  }

  /**
   * Deactivate profile (soft delete)
   */
  static async deactivateProfile(userId: string): Promise<void> {
    try {
      console.log('👤 Deactivating profile for user:', userId);

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deactivating profile:', error);
        throw error;
      }

      console.log('✅ Profile deactivated');
    } catch (error) {
      console.error('❌ Error in deactivateProfile:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing profiles table connection...');

      const { data, error } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('❌ Profiles table connection failed:', error);
        return false;
      }

      console.log('✅ Profiles table connection successful');
      return true;
    } catch (error) {
      console.error('❌ Error testing profiles connection:', error);
      return false;
    }
  }

  /**
   * Helper function to calculate full name
   */
  private static calculateFullName(firstName?: string, lastName?: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'User';
    }
  }

  /**
   * Helper function to calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Validate the birth date
    if (isNaN(birthDate.getTime())) {
      console.warn('Invalid birth date provided:', dateOfBirth);
      return 0;
    }
    
    // Check if birth date is in the future
    if (birthDate > today) {
      console.warn('Birth date is in the future:', dateOfBirth);
      return 0;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Ensure age is not negative
    return Math.max(0, age);
  }
}