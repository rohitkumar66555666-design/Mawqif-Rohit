import { supabase } from './supabase';

// Simple bookmarks service used by the BookmarkDebugger component
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('places').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection exception:', err);
    return false;
  }
}

export async function addBookmark(userId: string, placeId: string): Promise<void> {
  try {
    const { error } = await supabase.from('bookmarks').insert({ user_id: userId, place_id: placeId });
    if (error) throw error;
  } catch (err) {
    console.error('addBookmark error:', err);
    throw err;
  }
}

export async function removeBookmark(userId: string, placeId: string): Promise<void> {
  try {
    const { error } = await supabase.from('bookmarks').delete().match({ user_id: userId, place_id: placeId });
    if (error) throw error;
  } catch (err) {
    console.error('removeBookmark error:', err);
    throw err;
  }
}

export async function getBookmarksForUser(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('bookmarks').select('place_id').eq('user_id', userId);
    if (error) throw error;
    if (!data) return [];
    return data.map((row: any) => row.place_id);
  } catch (err) {
    console.error('getBookmarksForUser error:', err);
    throw err;
  }
}
