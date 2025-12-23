import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, PLACE_TYPES } from "../utils/constants";
import { rf } from "../utils/responsive";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  createdTime?: "hour" | "day" | "week" | "month" | null;
  rating?: number | null;
  womenArea?: boolean;
  radius?: number | null; // Allow null to disable radius filter
  capacity?: number | null;
  placeType?: string | null;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: FilterOptions = {
      createdTime: null,
      rating: null,
      womenArea: false,
      radius: 5000,
      capacity: null,
      placeType: null,
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={rf(32)} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Place Added Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="schedule" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Place Added</Text>
            </View>
            <View style={styles.buttonGroup}>
              {[
                { label: "Hour ago", value: "hour" },
                { label: "Day ago", value: "day" },
                { label: "Week ago", value: "week" },
                { label: "Month ago", value: "month" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    filters.createdTime === option.value &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      createdTime:
                        filters.createdTime === option.value
                          ? null
                          : (option.value as any),
                    })
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.createdTime === option.value &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="star" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
            </View>
            <View style={styles.buttonGroup}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.ratingButton,
                    filters.rating === star && styles.ratingButtonActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      rating: filters.rating === star ? null : star,
                    })
                  }
                >
                  <MaterialIcons 
                    name="star" 
                    size={rf(20)} 
                    color={filters.rating === star ? COLORS.surface : "#F59E0B"} 
                  />
                  <Text
                    style={[
                      styles.ratingButtonText,
                      filters.rating === star && styles.ratingButtonTextActive,
                    ]}
                  >
                    {star}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Women's Area Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="woman" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Women's Area</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filters.womenArea === true && styles.filterButtonActive,
                ]}
                onPress={() =>
                  setFilters({
                    ...filters,
                    womenArea: filters.womenArea === true ? false : true,
                  })
                }
              >
                <View style={styles.filterButtonContent}>
                  <MaterialIcons name="check" size={rf(18)} color={filters.womenArea === true ? COLORS.surface : COLORS.success} />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.womenArea === true && styles.filterButtonTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filters.womenArea === false && styles.filterButtonActive,
                ]}
                onPress={() =>
                  setFilters({
                    ...filters,
                    womenArea: false,
                  })
                }
              >
                <View style={styles.filterButtonContent}>
                  <MaterialIcons name="close" size={rf(18)} color={filters.womenArea === false ? COLORS.surface : COLORS.error} />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.womenArea === false &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    No
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Radius Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="location-on" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Search Radius</Text>
            </View>
            <View style={styles.radiusInfo}>
              <Text style={styles.radiusValue}>{filters.radius || 5000}m</Text>
              <Text style={styles.radiusKm}>
                ({((filters.radius || 5000) / 1000).toFixed(1)}km)
              </Text>
            </View>
            <View style={styles.buttonGroup}>
              {[500, 1000, 2000, 3000, 5000].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.filterButton,
                    filters.radius === radius && styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      radius: radius,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.radius === radius &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {radius < 1000 ? `${radius}m` : `${radius / 1000}km`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Capacity Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="group" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Capacity</Text>
            </View>
            <View style={styles.buttonGroup}>
              {[50, 100, 150, 200, 300, 400].map((capacity) => (
                <TouchableOpacity
                  key={capacity}
                  style={[
                    styles.filterButton,
                    filters.capacity === capacity && styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      capacity: filters.capacity === capacity ? null : capacity,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.capacity === capacity &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {capacity}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Place Type Filter */}
          <View style={styles.filterSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="business" size={rf(20)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Type of Place</Text>
            </View>
            <View style={styles.buttonGroup}>
              {PLACE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.filterButton,
                    filters.placeType === type.value &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      placeType:
                        filters.placeType === type.value ? null : type.value,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.placeType === type.value &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: rf(24),
    fontWeight: "700",
    color: COLORS.surface,
  },

  resetButton: {
    fontSize: rf(16),
    color: COLORS.surface,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minWidth: 70,
    minHeight: 48,
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingButtonText: {
    fontSize: rf(16),
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: 8,
  },
  ratingButtonTextActive: {
    color: COLORS.surface,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: rf(16),
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: COLORS.surface,
  },
  radiusInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  radiusValue: {
    fontSize: rf(24),
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 10,
  },
  radiusKm: {
    fontSize: rf(16),
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minHeight: 56,
  },
  applyButtonText: {
    fontSize: rf(18),
    fontWeight: "700",
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
});
