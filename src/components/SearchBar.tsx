import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS } from "../utils/constants";
import { getResponsiveDimensions, rs, rf } from "../utils/responsive";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({
  value,
  onChangeText,
  onFilterPress,
  placeholder = "Search city, masjid, address...",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <MaterialIcons name="search" size={rf(24)} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <Feather name="filter" size={rf(24)} color={COLORS.surface} />
      </TouchableOpacity>
    </View>
  );
});

const responsiveDimensions = getResponsiveDimensions();

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: rs(8),
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.08,
    shadowRadius: rs(3),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: rs(24),
    paddingHorizontal: rs(12),
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: responsiveDimensions.inputHeight,
  },
  searchIcon: {
    marginRight: rs(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: rs(10),
    fontSize: rf(16),
    color: COLORS.text,
    fontWeight: '500',
  },
  filterButton: {
    width: responsiveDimensions.buttonHeight,
    height: responsiveDimensions.buttonHeight,
    borderRadius: responsiveDimensions.buttonHeight / 2,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(3),
  },

});
