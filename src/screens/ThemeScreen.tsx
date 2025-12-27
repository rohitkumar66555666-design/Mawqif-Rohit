import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { rs, rf, getSafeAreaInsets } from '../utils/responsive';

interface ThemeScreenProps {
  navigation: any;
}

export const ThemeScreen: React.FC<ThemeScreenProps> = ({ navigation }) => {
  const { theme, colors, setTheme } = useTheme();
  const { t } = useLanguage();

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    console.log(`Theme changed to: ${selectedTheme}`);
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
        <Text style={[styles.headerTitle, { color: colors.textInverse }]}>{t('chooseTheme')}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="menu" size={rf(24)} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('chooseTheme')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('selectPreferredAppearance')}</Text>

        {/* Light Mode Option */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.surface, borderColor: colors.border },
            theme === 'light' && { borderColor: colors.primary, borderWidth: 3 }
          ]}
          onPress={() => handleThemeSelect('light')}
        >
          <View style={styles.themeOptionContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <MaterialIcons name="wb-sunny" size={rf(28)} color="#FFA726" />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeTitle, { color: colors.text }]}>{t('lightMode')}</Text>
              <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                {t('lightModeDesc')}
              </Text>
            </View>
            {theme === 'light' && (
              <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={rf(20)} color={colors.textInverse} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Dark Mode Option */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.surface, borderColor: colors.border },
            theme === 'dark' && { borderColor: colors.primary, borderWidth: 3 }
          ]}
          onPress={() => handleThemeSelect('dark')}
        >
          <View style={styles.themeOptionContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <MaterialIcons name="nightlight-round" size={rf(28)} color="#5C6BC0" />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeTitle, { color: colors.text }]}>{t('darkMode')}</Text>
              <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                {t('darkModeDesc')}
              </Text>
            </View>
            {theme === 'dark' && (
              <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={rf(20)} color={colors.textInverse} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={[styles.infoContainer, { backgroundColor: colors.primaryLight }]}>
          <MaterialIcons name="info" size={rf(20)} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('themeChangesInstant')}
          </Text>
        </View>
      </View>
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
  themeOption: {
    borderRadius: rs(16),
    marginBottom: rs(16),
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
  },
  themeOptionContent: {
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
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    marginBottom: rs(4),
  },
  themeDescription: {
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
    marginTop: rs(24),
  },
  infoText: {
    fontSize: rf(14),
    marginLeft: rs(12),
    flex: 1,
    lineHeight: rf(20),
  },
});