import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuestCard } from "@/components/QuestCard";
import { XPBar } from "@/components/XPBar";
import Colors from "@/constants/colors";
import { CharacterClass, PARKS, ParkId, Quest, useGame } from "@/context/GameContext";

const CLASS_LABELS: Record<CharacterClass, string> = {
  ranger: "Ranger",
  hiker: "Hiker",
  naturalist: "Naturalist",
  tracker: "Tracker",
};

const PARK_IMAGES: Record<ParkId, any> = {
  yellowstone: require("@/assets/images/park_yellowstone.png"),
  grand_teton: require("@/assets/images/park_grand_teton.png"),
};

const FILTER_OPTIONS = [
  { id: "available", label: "Available" },
  { id: "active", label: "Active" },
  { id: "all", label: "All" },
  { id: "completed", label: "Done" },
] as const;

type FilterType = (typeof FILTER_OPTIONS)[number]["id"];

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const { character, quests, activeParkId } = useGame();
  const [filter, setFilter] = useState<FilterType>("available");

  if (!character) return null;

  const activePark = PARKS.find((p) => p.id === activeParkId)!;
  const classColor =
    Colors[`${character.class}Color` as keyof typeof Colors] as string;

  // Filter by current park and class
  const myQuests = quests.filter(
    (q) =>
      q.parkId === activeParkId &&
      (q.class === "all" || q.class === character.class)
  );

  const filteredQuests =
    filter === "all"
      ? myQuests
      : myQuests.filter((q) => {
          if (filter === "available") return q.status === "available";
          if (filter === "active") return q.status === "active";
          if (filter === "completed") return q.status === "completed";
          return true;
        });

  const availableCount = myQuests.filter((q) => q.status === "available").length;
  const completedCount = myQuests.filter((q) => q.status === "completed").length;

  function handleQuestPress(quest: Quest) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/quest-detail", params: { questId: quest.id } });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Park banner */}
        <View style={styles.parkBanner}>
          <Image
            source={PARK_IMAGES[activeParkId]}
            style={styles.parkBannerImage}
            resizeMode="cover"
          />
          <View style={styles.parkBannerOverlay} />
          <View style={styles.parkBannerContent}>
            <View style={styles.parkBannerLeft}>
              <Text style={styles.parkBannerLabel}>Quest Map</Text>
              <Text style={styles.parkBannerName}>{activePark.shortName}</Text>
            </View>
            <View style={[styles.classTag, { backgroundColor: `${classColor}30` }]}>
              <Text style={[styles.classTagText, { color: classColor }]}>
                {CLASS_LABELS[character.class]}
              </Text>
            </View>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <XPBar
            currentXP={character.xp}
            maxXP={character.xpToNextLevel}
            level={character.level}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="star-four-points" size={9} color={Colors.accent} />
            <Text style={styles.statValue}>{availableCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Feather name="check-circle" size={9} color={Colors.success} />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Feather name="award" size={9} color={Colors.sky} />
            <Text style={styles.statValue}>{character.xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersScroll}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.filterPill, active && { backgroundColor: classColor }]}
              onPress={() => {
                setFilter(opt.id);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Quest list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredQuests.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No quests here</Text>
            <Text style={styles.emptyText}>
              {filter === "active"
                ? "Start a quest from the Available tab"
                : filter === "completed"
                ? "Complete quests to see them here"
                : "All quests are locked or completed"}
            </Text>
          </View>
        ) : (
          filteredQuests.map((quest) => (
            <View key={quest.id}>
              <QuestCard quest={quest} onPress={() => handleQuestPress(quest)} />
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
    paddingBottom: 6,
    gap: 6,
  },
  parkBanner: {
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    position: "relative",
  },
  parkBannerImage: {
    width: "100%",
    height: "100%",
  },
  parkBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  parkBannerContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  parkBannerLeft: {
    gap: 2,
  },
  parkBannerLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  parkBannerName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  classTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  classTagText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  xpSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 9,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 7,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.surface,
    marginHorizontal: 8,
  },
  filtersScroll: {
    maxHeight: 46,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  filtersContent: {
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
