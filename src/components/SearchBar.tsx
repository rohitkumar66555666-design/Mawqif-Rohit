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
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
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
  placeholder,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const defaultPlaceholder = placeholder || t('searchPlaceholder');
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={rf(24)} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={defaultPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]} onPress={onFilterPress}>
        <Feather name="filter" size={rf(24)} color={colors.textInverse} />
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
    borderBottomWidth: 1,
    gap: rs(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.08,
    shadowRadius: rs(3),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: rs(24),
    paddingHorizontal: rs(12),
    borderWidth: 1.5,
    minHeight: responsiveDimensions.inputHeight,
  },
  searchIcon: {
    marginRight: rs(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: rs(10),
    fontSize: rf(16),
    fontWeight: '500',
  },
  filterButton: {
    width: responsiveDimensions.buttonHeight,
    height: responsiveDimensions.buttonHeight,
    borderRadius: responsiveDimensions.buttonHeight / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(3),
  },

});
