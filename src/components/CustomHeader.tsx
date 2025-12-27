import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { rs, rf, getSafeAreaInsets } from '../utils/responsive';

interface CustomHeaderProps {
  navigation: any;
  title?: string;
  subtitle?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  navigation,
  title = "Mawqif",
  subtitle = "Your prayer spaces hub"
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme, colors } = useTheme();
  const { t } = useLanguage();

  const openMenu = () => {
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const menuItems = [
    {
      icon: 'person',
      title: t('profile'),
      subtitle: 'Account & settings',
      onPress: () => {
        closeMenu();
        navigation.navigate('Profile');
      }
    },
    {
      icon: 'explore',
      title: t('browse'),
      subtitle: 'Explore prayer spaces',
      onPress: () => {
        closeMenu();
        navigation.navigate('HomeTab');
      }
    },
    {
      icon: 'palette',
      title: t('theme'),
      subtitle: 'App appearance',
      onPress: () => {
        closeMenu();
        navigation.navigate('Theme');
      }
    },
    {
      icon: 'language',
      title: t('language'),
      subtitle: 'Change language',
      onPress: () => {
        closeMenu();
        navigation.navigate('Language');
      }
    },
    {
      icon: 'business',
      title: t('host'),
      subtitle: 'Manage your places',
      onPress: () => {
        closeMenu();
        // TODO: Navigate to host - empty for now
      }
    },
    {
      icon: 'notifications',
      title: t('notifications'),
      subtitle: 'Manage alerts',
      onPress: () => {
        closeMenu();
        // TODO: Navigate to notifications - empty for now
      }
    }
  ];

  return (
    <>
      <StatusBar backgroundColor={colors.statusBar} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="mosque" size={rf(28)} color={colors.textInverse} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.textInverse }]}>{t('appName')}</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>{t('appSubtitle')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openMenu}
            activeOpacity={0.7}
          >
            <MaterialIcons name="menu" size={rf(28)} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeMenu}
          />
          <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.menuHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={styles.menuHeaderContent}>
                <View style={[styles.menuLogoContainer, { backgroundColor: colors.primaryLight }]}>
                  <MaterialIcons name="mosque" size={rf(32)} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('appName')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>Prayer Finder</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background }]}
                onPress={closeMenu}
              >
                <MaterialIcons name="close" size={rf(24)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: colors.primaryLight }]}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={rf(24)}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={rf(20)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.menuFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
              <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Made with ❤️ for the Muslim community</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: getSafeAreaInsets().top + rs(8),
    paddingBottom: rs(16),
    paddingHorizontal: rs(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(4),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(12),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: rf(20),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: rf(12),
    marginTop: rs(2),
  },
  menuButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: screenWidth * 0.85,
    height: screenHeight,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: rs(-4), height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: rs(8),
  },
  menuHeader: {
    paddingTop: getSafeAreaInsets().top + rs(20),
    paddingBottom: rs(20),
    paddingHorizontal: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  menuHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuLogoContainer: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(12),
  },
  menuTitle: {
    fontSize: rf(20),
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: rf(14),
    marginTop: rs(2),
  },
  closeButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    flex: 1,
    paddingTop: rs(8),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(16),
    paddingHorizontal: rs(20),
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(16),
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: rf(16),
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: rf(13),
    marginTop: rs(2),
  },
  menuFooter: {
    padding: rs(20),
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: rf(12),
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: rf(11),
    marginTop: rs(4),
    textAlign: 'center',
  },
});