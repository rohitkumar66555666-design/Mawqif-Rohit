import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { RootStackParamList } from "../types";
import { HomeScreen } from "../screens/HomeScreen";
import { PlaceDetailScreen } from "../screens/PlaceDetailScreen";
import { AddPlaceScreen } from "../screens/AddPlaceScreen";
import { MapScreen } from "../screens/MapScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MyReviewsScreen } from "../screens/MyReviewsScreen";
import { BookmarksScreen } from "../screens/BookmarksScreen";
import { CacheManagementScreen } from "../screens/CacheManagementScreen";
import { ThemeScreen } from "../screens/ThemeScreen";
import { LanguageScreen } from "../screens/LanguageScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { CustomHeader } from "../components/CustomHeader";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

import { getResponsiveDimensions, rs, rf, getSafeAreaInsets } from "../utils/responsive";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom Bottom Tab Bar with proper spacing
const CustomBottomTabBar = (props: BottomTabBarProps) => {
  const { state, descriptors, navigation } = props;
  const { colors } = useTheme();
  const { t } = useLanguage();

  const handleAddPlacePress = () => {
    navigation.navigate("AddPlaceTab");
  };

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Home Tab - Left */}
        <TouchableOpacity
          onPress={() => navigation.navigate("HomeTab")}
          style={[styles.tabItem, state.index === 0 && { backgroundColor: colors.primaryLight }]}
        >
          <MaterialIcons 
            name="home" 
            size={rf(28)} 
            color={state.index === 0 ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textSecondary },
              state.index === 0 && { color: colors.primary, fontWeight: "700" },
            ]}
          >
            {t('home')}
          </Text>
        </TouchableOpacity>

        {/* Center Add Place Button */}
        <TouchableOpacity
          onPress={handleAddPlacePress}
          style={[
            styles.centerTab,
            state.index === 2 && styles.centerTabActive,
          ]}
        >
          <View style={[styles.centerButtonInner, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="add" size={rf(32)} color={colors.textInverse} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textSecondary },
              state.index === 2 && { color: colors.primary, fontWeight: "700" },
            ]}
          >
            {t('add')}
          </Text>
        </TouchableOpacity>

        {/* Map Tab - Right */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MapTab")}
          style={[styles.tabItem, state.index === 1 && { backgroundColor: colors.primaryLight }]}
        >
          <MaterialIcons 
            name="map" 
            size={rf(28)} 
            color={state.index === 1 ? colors.primary : colors.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textSecondary },
              state.index === 1 && { color: colors.primary, fontWeight: "700" },
            ]}
          >
            {t('map')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tab Navigator for main screens
const TabNavigator = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        header: () => <CustomHeader navigation={navigation} />,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: `${t('appName')} - Prayer Finder`,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: `${t('map')} - Prayer Spaces`,
        }}
      />
      <Tab.Screen
        name="AddPlaceTab"
        component={AddPlaceScreen}
        options={{
          title: t('addPrayerSpace'),
        }}
      />
    </Tab.Navigator>
  );
};

// Wrapper component to use theme context inside NavigationContainer
const ThemedAppNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textInverse,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PlaceDetail"
          component={PlaceDetailScreen}
          options={{
            title: 'Place Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="CacheManagement"
          component={CacheManagementScreen}
          options={{
            title: 'Offline Cache',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Theme"
          component={ThemeScreen}
          options={{
            headerShown: false, // Use custom header
          }}
        />
        <Stack.Screen
          name="Language"
          component={LanguageScreen}
          options={{
            headerShown: false, // Use custom header
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false, // Use custom header
          }}
        />
        <Stack.Screen
          name="MyReviews"
          component={MyReviewsScreen}
          options={{
            title: 'My Reviews',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{
            title: 'My Bookmarks',
            headerBackTitle: 'Back',
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main Stack Navigator
export const AppNavigator: React.FC = () => {
  return <ThemedAppNavigator />;
};

// Styles for custom bottom tab bar
const responsiveDimensions = getResponsiveDimensions();
const safeAreaInsets = getSafeAreaInsets();

const styles = StyleSheet.create({
  tabBarContainer: {
    paddingBottom: rs(20),
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: rs(8),
    paddingTop: rs(8),
    paddingBottom: rs(8),
    height: rs(70),
    justifyContent: "space-between",
    alignItems: "flex-end",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(-2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(4),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rs(8),
    paddingHorizontal: rs(8),
    borderRadius: rs(12),
  },
  tabItemActive: {
  },
  tabIcon: {
    marginBottom: rs(4),
  },
  tabLabel: {
    fontSize: rf(11),
    fontWeight: "500",
  },
  tabLabelActive: {
  },
  centerTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: rs(8),
  },
  centerTabActive: {
    backgroundColor: "transparent",
  },
  centerButtonInner: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rs(2),
    elevation: 6,
    shadowOffset: { width: 0, height: rs(3) },
    shadowOpacity: 0.35,
    shadowRadius: rs(6),
  },

});
