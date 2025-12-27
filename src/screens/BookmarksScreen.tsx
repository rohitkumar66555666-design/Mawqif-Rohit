import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserInfo } from '../lib/authHelper';
import { BookmarksService, Bookmark } from '../services/bookmarks.service';
import { rf, rs } from '../utils/responsive';

interface BookmarksScreenProps {
  navigation: any;
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useUserInfo();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBookmarks();
    }
  }, [isAuthenticated, user]);

  const loadBookmarks = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userBookmarks = await BookmarksService.getUserBookmarks(user.uid);
      setBookmarks(userBookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (placeId: string) => {
    if (!user?.uid) return;

    Alert.alert(
      t('removeBookmark') || 'Remove Bookmark',
      t('removeBookmarkConfirmation') || 'Are you sure you want to remove this bookmark?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('remove') || 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookmarksService.removeBookmark(user.uid, placeId);
              Alert.alert(t('success') || 'Success', t('bookmarkRemovedSuccessfully') || 'Bookmark removed successfully');
              loadBookmarks();
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert(t('error') || 'Error', t('failedToRemoveBookmark') || 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const handlePlacePress = (placeId: string) => {
    navigation.navigate('PlaceDetail', { placeId });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="bookmark-border" size={rf(64)} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>{t('loginRequired') || 'Login Required'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('loginToViewBookmarks') || 'Please login to view your bookmarks'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('login') || 'Login'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('myBookmarks') || 'My Bookmarks'}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {t('yourSavedPlaces') || 'Your saved places'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('loadingBookmarks') || 'Loading bookmarks...'}
          </Text>
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="bookmark-border" size={rf(64)} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>{t('noBookmarksYet') || 'No Bookmarks Yet'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('startBookmarkingPlaces') || 'Start bookmarking places you want to visit later'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('explorePlaces') || 'Explore Places'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: colors.text }]}>
              {t('totalBookmarks') || 'Total Bookmarks'}: {String(bookmarks.length)}
            </Text>
          </View>

          <View style={styles.listContainer}>
            {bookmarks.map((bookmark: Bookmark) => (
              <TouchableOpacity
                key={bookmark.id}
                style={[styles.bookmarkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handlePlacePress(bookmark.place_id)}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
                    {bookmark.place_photo ? (
                      <Image 
                        source={{ uri: bookmark.place_photo }} 
                        style={styles.placeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: colors.primaryLight }]}>
                        <MaterialIcons name="mosque" size={rf(24)} color={colors.textInverse} />
                      </View>
                    )}
                  </View>

                  <View style={styles.placeInfo}>
                    <Text style={[styles.placeTitle, { color: colors.text }]} numberOfLines={1}>
                      {String(bookmark.place_title || t('unknownPlace') || 'Unknown Place')}
                    </Text>
                    
                    <View style={styles.addressRow}>
                      <MaterialIcons name="location-on" size={rf(14)} color={colors.textSecondary} />
                      <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {String(bookmark.place_address || t('unknownAddress') || 'Unknown Address')}
                      </Text>
                    </View>

                    <View style={styles.typeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.typeText, { color: colors.textInverse }]}>
                          {String(bookmark.place_type || t('other') || 'Other')}
                        </Text>
                      </View>
                      
                      {bookmark.place_rating && bookmark.place_rating > 0 ? (
                        <View style={styles.ratingRow}>
                          <MaterialIcons name="star" size={rf(16)} color="#F59E0B" />
                          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                            {String(bookmark.place_rating.toFixed(1))}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      {t('bookmarked') || 'Bookmarked'}: {String(bookmark.created_at ? new Date(bookmark.created_at).toLocaleDateString() : t('unknown') || 'Unknown')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRemoveBookmark(bookmark.place_id)}
                  >
                    <MaterialIcons name="bookmark-remove" size={rf(20)} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: rs(20),
    paddingBottom: rs(16),
  },
  headerTitle: {
    fontSize: rf(24),
    fontWeight: '700',
    marginBottom: rs(4),
  },
  headerSubtitle: {
    fontSize: rf(16),
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(40),
  },
  title: {
    fontSize: rf(20),
    fontWeight: '600',
    marginTop: rs(16),
    marginBottom: rs(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: rf(16),
    textAlign: 'center',
    marginBottom: rs(24),
    lineHeight: rf(22),
  },
  button: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rs(8),
  },
  buttonText: {
    fontSize: rf(16),
    fontWeight: '600',
  },
  loadingText: {
    fontSize: rf(16),
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    margin: rs(16),
    padding: rs(16),
    alignItems: 'center',
  },
  statsText: {
    fontSize: rf(18),
    fontWeight: '600',
  },
  listContainer: {
    padding: rs(16),
  },
  bookmarkCard: {
    borderRadius: rs(12),
    marginBottom: rs(12),
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  cardContent: {
    flexDirection: 'row',
    padding: rs(12),
    alignItems: 'center',
  },
  imageContainer: {
    width: rs(60),
    height: rs(60),
    borderRadius: rs(8),
    overflow: 'hidden',
    marginRight: rs(12),
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginRight: rs(8),
  },
  placeTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    marginBottom: rs(4),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  addressText: {
    fontSize: rf(13),
    marginLeft: rs(4),
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(4),
  },
  typeBadge: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: rs(12),
    marginRight: rs(8),
  },
  typeText: {
    fontSize: rf(11),
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: rf(12),
    marginLeft: rs(2),
    fontWeight: '500',
  },
  dateText: {
    fontSize: rf(11),
    fontStyle: 'italic',
  },
  removeButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
});