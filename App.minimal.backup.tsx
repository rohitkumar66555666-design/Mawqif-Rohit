import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [currentTab, setCurrentTab] = React.useState('home');

  const renderHome = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.title}>🕌 Mawqif - Prayer Finder</Text>
      <Text style={styles.subtitle}>Find nearby prayer spaces</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome to Mawqif</Text>
        <Text style={styles.cardText}>
          Discover prayer spaces around you. This is a minimal version to test the app functionality.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sample Prayer Place</Text>
        <Text style={styles.cardText}>📍 Local Mosque</Text>
        <Text style={styles.cardText}>⭐ 4.5 stars</Text>
        <Text style={styles.cardText}>📞 Contact: +91 12345 67890</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <Text style={styles.cardText}>✅ Find prayer spaces</Text>
        <Text style={styles.cardText}>✅ View details</Text>
        <Text style={styles.cardText}>✅ Get directions</Text>
        <Text style={styles.cardText}>✅ Multi-language support</Text>
      </View>
    </ScrollView>
  );

  const renderMap = () => (
    <View style={styles.content}>
      <Text style={styles.title}>🗺️ Map View</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Map Feature</Text>
        <Text style={styles.cardText}>
          Map functionality will be available in the full version. 
          This minimal version focuses on core functionality.
        </Text>
      </View>
    </View>
  );

  const renderAdd = () => (
    <View style={styles.content}>
      <Text style={styles.title}>➕ Add Place</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Prayer Space</Text>
        <Text style={styles.cardText}>
          Feature to add new prayer spaces will be available in the full version.
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return renderHome();
      case 'map': return renderMap();
      case 'add': return renderAdd();
      default: return renderHome();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mawqif</Text>
        <Text style={styles.headerSubtitle}>Prayer Finder</Text>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'home' && styles.navItemActive]}
          onPress={() => setCurrentTab('home')}
        >
          <MaterialIcons 
            name="home" 
            size={24} 
            color={currentTab === 'home' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'map' && styles.navItemActive]}
          onPress={() => setCurrentTab('map')}
        >
          <MaterialIcons 
            name="map" 
            size={24} 
            color={currentTab === 'map' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, currentTab === 'map' && styles.navTextActive]}>
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'add' && styles.navItemActive]}
          onPress={() => setCurrentTab('add')}
        >
          <MaterialIcons 
            name="add" 
            size={24} 
            color={currentTab === 'add' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, currentTab === 'add' && styles.navTextActive]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: '#f0f8f0',
    borderRadius: 10,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  navTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});