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
import { CacheManagementScreen } from "../screens/CacheManagementScreen";

import { COLORS } from "../utils/constants";
import { getResponsiveDimensions, rs, rf, getSafeAreaInsets } from "../utils/responsive";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom Bottom Tab Bar with proper spacing
const CustomBottomTabBar = (props: BottomTabBarProps) => {
  const { state, descriptors, navigation } = props;

  const handleAddPlacePress = () => {
    navigation.navigate("AddPlaceTab");
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Home Tab - Left */}
        <TouchableOpacity
          onPress={() => navigation.navigate("HomeTab")}
          style={[styles.tabItem, state.index === 0 && styles.tabItemActive]}
        >
          <MaterialIcons 
            name="home" 
            size={rf(28)} 
            color={state.index === 0 ? COLORS.primary : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              state.index === 0 && styles.tabLabelActive,
            ]}
          >
            Home
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
          <View style={styles.centerButtonInner}>
            <MaterialIcons name="add" size={rf(32)} color={COLORS.surface} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              state.index === 2 && styles.tabLabelActive,
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>

        {/* Map Tab - Right */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MapTab")}
          style={[styles.tabItem, state.index === 1 && styles.tabItemActive]}
        >
          <MaterialIcons 
            name="map" 
            size={rf(28)} 
            color={state.index === 1 ? COLORS.primary : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              state.index === 1 && styles.tabLabelActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tab Navigator for main screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.surface,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Mawqif - Prayer Finder',
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: 'Map - Prayer Spaces',
        }}
      />
      <Tab.Screen
        name="AddPlaceTab"
        component={AddPlaceScreen}
        options={{
          title: 'Add Prayer Space',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.surface,
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

      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles for custom bottom tab bar
const responsiveDimensions = getResponsiveDimensions();
const safeAreaInsets = getSafeAreaInsets();

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: rs(20),
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
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
    backgroundColor: "#dcffc0",
  },
  tabIcon: {
    marginBottom: rs(4),
  },
  tabLabel: {
    fontSize: rf(11),
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
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
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rs(2),
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(3) },
    shadowOpacity: 0.35,
    shadowRadius: rs(6),
  },

});
