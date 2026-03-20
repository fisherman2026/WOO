import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Park, ParkId, PARKS, useGame } from "@/context/GameContext";

const PARK_IMAGES: Record<ParkId, ImageSourcePropType> = {
  yellowstone: require("@/assets/images/park_yellowstone.png"),
  grand_teton: require("@/assets/images/park_grand_teton.png"),
};

function ParkCard({ park, isActive, onSelect }: {
  park: Park;
  isActive: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { quests } = useGame();
  const parkQuests = quests.filter((q) => q.parkId === park.id);
  const completedCount = parkQuests.filter((q) => q.status === "completed").length;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onSelect}
    >
    <Animated.View
      style={[styles.parkCard, isActive && { borderColor: park.accentColor, borderWidth: 2 }, animStyle]}
    >
      {/* Hero image */}
      <View style={styles.imageContainer}>
        <Image
          source={PARK_IMAGES[park.id]}
          style={styles.parkImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.imageOverlay} />

        {/* Active badge */}
        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: park.accentColor }]}>
            <Feather name="check" size={12} color="#fff" />
            <Text style={styles.activeBadgeText}>Active Park</Text>
          </View>
        )}

        {/* Park name over image */}
        <View style={styles.imageTextContainer}>
          <Text style={styles.parkImageName}>{park.shortName}</Text>
          <Text style={styles.parkImageState}>{park.state}</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={styles.tagline}>{park.tagline}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {park.description}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.statText}>Est. {park.established}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.stat}>
            <Feather name="map" size={12} color={Colors.textMuted} />
            <Text style={styles.statText}>{park.size}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="star-four-points" size={12} color={park.accentColor} />
            <Text style={[styles.statText, { color: park.accentColor }]}>
              {completedCount}/{parkQuests.length} quests
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {park.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                tag === "Free Starter" && { backgroundColor: `${Colors.success}20`, borderColor: `${Colors.success}40` },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  tag === "Free Starter" && { color: Colors.success },
                ]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          style={[
            styles.selectBtn,
            isActive
              ? { backgroundColor: `${park.accentColor}20`, borderColor: `${park.accentColor}60` }
              : { backgroundColor: park.accentColor },
          ]}
          onPress={onSelect}
        >
          {isActive ? (
            <>
              <Feather name="check-circle" size={16} color={park.accentColor} />
              <Text style={[styles.selectBtnText, { color: park.accentColor }]}>
                Exploring This Park
              </Text>
            </>
          ) : (
            <>
              <Feather name="map-pin" size={16} color="#fff" />
              <Text style={[styles.selectBtnText, { color: "#fff" }]}>
                Explore This Park
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
    </Pressable>
  );
}

export default function ParksScreen() {
  const insets = useSafeAreaInsets();
  const { activeParkId, setActivePark, quests } = useGame();

  const totalCompleted = quests.filter((q) => q.status === "completed").length;
  const totalQuests = quests.length;

  async function handleSelectPark(parkId: ParkId) {
    if (parkId === activeParkId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setActivePark(parkId);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.replace("/title")}>
          <Feather name="arrow-left" size={18} color={Colors.textSecondary} />
          <Text style={styles.backBtnText}>Title Screen</Text>
        </Pressable>
        <Text style={styles.headerTitle}>National Parks</Text>
        <Text style={styles.headerSubtitle}>
          Select a park to explore its quests and discoveries
        </Text>

        {/* Global progress */}
        <View style={styles.globalProgress}>
          <View style={styles.globalProgressLeft}>
            <Feather name="globe" size={16} color={Colors.accent} />
            <Text style={styles.globalProgressText}>
              {totalCompleted} quests completed across all parks
            </Text>
          </View>
          <Text style={[styles.globalProgressPct, { color: Colors.accent }]}>
            {totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0}%
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {PARKS.map((park) => (
          <ParkCard
            key={park.id}
            park={park}
            isActive={activeParkId === park.id}
            onSelect={() => handleSelectPark(park.id)}
          />
        ))}

        {/* Coming soon teaser */}
        <View style={styles.comingSoon}>
          <View style={styles.comingSoonInner}>
            <Feather name="lock" size={22} color={Colors.textMuted} />
            <Text style={styles.comingSoonTitle}>More Parks Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Zion, Yosemite, Glacier, and more are on their way. Each park brings
              new quests, lore scrolls, and exclusive collectibles.
            </Text>
            <View style={styles.upcomingParksRow}>
              {["Zion NP", "Yosemite NP", "Glacier NP", "Acadia NP"].map((name) => (
                <View key={name} style={styles.upcomingTag}>
                  <Text style={styles.upcomingTagText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
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
    paddingBottom: 16,
    gap: 6,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingRight: 10,
    marginBottom: 2,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  globalProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  globalProgressLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  globalProgressText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    flex: 1,
  },
  globalProgressPct: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 16,
  },
  parkCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  imageContainer: {
    height: 200,
    position: "relative",
  },
  parkImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  activeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  imageTextContainer: {
    position: "absolute",
    bottom: 14,
    left: 16,
  },
  parkImageName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  parkImageState: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  // Coming soon
  comingSoon: {
    marginBottom: 8,
  },
  comingSoonInner: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surface,
    borderStyle: "dashed",
  },
  comingSoonTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  comingSoonText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  upcomingParksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  upcomingTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  upcomingTagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
});
