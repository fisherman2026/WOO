import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InventoryItemCard } from "@/components/InventoryItem";
import Colors from "@/constants/colors";
import { InventoryItem, useGame } from "@/context/GameContext";

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "tool", label: "Tools" },
  { id: "weapon", label: "Gear" },
  { id: "lore", label: "Lore" },
  { id: "collectible", label: "Collectibles" },
  { id: "cosmetic", label: "Cosmetic" },
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]["id"];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { character } = useGame();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  if (!character) return null;

  const filteredItems: InventoryItem[] =
    filter === "all"
      ? character.inventory
      : character.inventory.filter((item) => item.type === filter);

  const rarityCount = {
    legendary: character.inventory.filter((i) => i.rarity === "legendary").length,
    rare: character.inventory.filter((i) => i.rarity === "rare").length,
    uncommon: character.inventory.filter((i) => i.rarity === "uncommon").length,
    common: character.inventory.filter((i) => i.rarity === "common").length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {character.inventory.length} items
            </Text>
          </View>
        </View>

        {/* Rarity summary */}
        <View style={styles.rarityRow}>
          {rarityCount.legendary > 0 && (
            <View style={[styles.rarityChip, { backgroundColor: `${Colors.accent}20` }]}>
              <MaterialCommunityIcons name="star-four-points" size={11} color={Colors.accent} />
              <Text style={[styles.rarityChipText, { color: Colors.accent }]}>
                {rarityCount.legendary} Legendary
              </Text>
            </View>
          )}
          {rarityCount.rare > 0 && (
            <View style={[styles.rarityChip, { backgroundColor: `${Colors.rare}20` }]}>
              <Feather name="zap" size={11} color={Colors.rare} />
              <Text style={[styles.rarityChipText, { color: Colors.rare }]}>
                {rarityCount.rare} Rare
              </Text>
            </View>
          )}
          {rarityCount.uncommon > 0 && (
            <View style={[styles.rarityChip, { backgroundColor: `${Colors.primaryLight}20` }]}>
              <Text style={[styles.rarityChipText, { color: Colors.primaryLight }]}>
                {rarityCount.uncommon} Uncommon
              </Text>
            </View>
          )}
          {rarityCount.common > 0 && (
            <View style={[styles.rarityChip, { backgroundColor: Colors.surface }]}>
              <Text style={[styles.rarityChipText, { color: Colors.textMuted }]}>
                {rarityCount.common} Common
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersScroll}
      >
        {CATEGORY_FILTERS.map((cat) => {
          const active = filter === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFilter(cat.id)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Items list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No items here</Text>
            <Text style={styles.emptyText}>
              Complete quests to earn gear, lore scrolls, and collectibles.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id}>
              <InventoryItemCard item={item} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  rarityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rarityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rarityChipText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  filtersScroll: {
    maxHeight: 46,
    marginBottom: 4,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 240,
  },
});
