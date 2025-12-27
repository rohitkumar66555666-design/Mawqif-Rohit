import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, languages, LanguageCode } from '../contexts/LanguageContext';
import { rs, rf, getSafeAreaInsets } from '../utils/responsive';

interface LanguageScreenProps {
  navigation: any;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: LanguageCode) => {
    setLanguage(selectedLanguage);
    console.log(`Language changed to: ${selectedLanguage}`);
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.statusBar} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <MaterialIcons name="arrow-back" size={rf(24)} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textInverse }]}>{t('chooseLanguage')}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="menu" size={rf(24)} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('chooseLanguage')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('selectPreferredLanguage')}</Text>

        {/* Language Options */}
        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                language === lang.code && { borderColor: colors.primary, borderWidth: 3 }
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <View style={styles.languageOptionContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <MaterialIcons name="language" size={rf(28)} color={colors.primary} />
                </View>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
                  <Text style={[styles.nativeName, { color: colors.textSecondary }]}>
                    {lang.nativeName}
                  </Text>
                </View>
                {language === lang.code && (
                  <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="check" size={rf(20)} color={colors.textInverse} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View style={[styles.infoContainer, { backgroundColor: colors.primaryLight }]}>
          <MaterialIcons name="info" size={rf(20)} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('languageChangesInstant')}
          </Text>
        </View>

        {/* Language Features */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Language Features:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="translate" size={rf(18)} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Complete app translation
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="format-textdirection-r-to-l" size={rf(18)} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                RTL support for Arabic & Urdu
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="save" size={rf(18)} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Preference saved automatically
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: getSafeAreaInsets().top + rs(8),
    paddingBottom: rs(16),
    paddingHorizontal: rs(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(4),
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: rs(20),
  },
  title: {
    fontSize: rf(28),
    fontWeight: '700',
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(16),
    marginBottom: rs(32),
  },
  languageList: {
    marginBottom: rs(32),
  },
  languageOption: {
    borderRadius: rs(16),
    marginBottom: rs(16),
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(20),
  },
  iconContainer: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(16),
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: rf(18),
    fontWeight: '600',
    marginBottom: rs(4),
  },
  nativeName: {
    fontSize: rf(14),
    lineHeight: rf(20),
  },
  checkIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: rs(16),
    borderRadius: rs(12),
    marginBottom: rs(24),
  },
  infoText: {
    fontSize: rf(14),
    marginLeft: rs(12),
    flex: 1,
    lineHeight: rf(20),
  },
  featuresContainer: {
    marginBottom: rs(32),
  },
  featuresTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    marginBottom: rs(16),
  },
  featuresList: {
    gap: rs(12),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  featureText: {
    fontSize: rf(14),
    flex: 1,
  },
});