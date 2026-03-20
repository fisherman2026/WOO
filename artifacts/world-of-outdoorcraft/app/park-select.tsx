import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Park, ParkId, PARKS, useGame } from "@/context/GameContext";

const PARK_IMAGES: Record<ParkId, ImageSourcePropType> = {
  yellowstone: require("@/assets/images/park_yellowstone.png"),
  grand_teton: require("@/assets/images/park_grand_teton.png"),
};

const LOCKED_PARKS = [
  { name: "Zion National Park", state: "Utah", description: "Ancient red-rock canyons, angel's landing, and emerald pools deep in the Utah desert." },
  { name: "Yosemite National Park", state: "California", description: "Legendary granite walls, towering waterfalls, and giant sequoias in the Sierra Nevada." },
  { name: "Glacier National Park", state: "Montana", description: "Going-to-the-Sun Road, grizzly bears, and ancient glaciers carved over ten thousand years." },
  { name: "Acadia National Park", state: "Maine", description: "Rocky Atlantic coastline, lighthouse trails, and the first sunrise point in the United States." },
];

function UnlockedParkCard({ park, selected, onSelect }: {
  park: Park;
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onSelect}
    >
    <Animated.View
      style={[
        styles.parkCard,
        selected && styles.parkCardSelected,
        animStyle,
      ]}
    >
      <View style={styles.parkImageWrap}>
        <Image source={PARK_IMAGES[park.id]} style={styles.parkImage} resizeMode="cover" />
        <View style={styles.parkImageOverlay} />
        {selected && (
          <View style={styles.selectedCheck}>
            <Feather name="check" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.parkImageTextWrap}>
          <View style={[styles.unlockBadge, { backgroundColor: Colors.success }]}>
            <Feather name="unlock" size={10} color="#fff" />
            <Text style={styles.unlockBadgeText}>Free</Text>
          </View>
        </View>
      </View>

      <View style={styles.parkCardBody}>
        <View>
          <Text style={styles.parkName}>{park.shortName}</Text>
          <Text style={styles.parkState}>{park.state}</Text>
        </View>
        <Text style={styles.parkDesc} numberOfLines={3}>
          {park.id === "yellowstone"
            ? "The crown jewel of the American wilderness — geysers, wolves, and ancient secrets await."
            : park.description}
        </Text>
        <View style={styles.parkMeta}>
          <Feather name="map" size={12} color={Colors.textMuted} />
          <Text style={styles.parkMetaText}>{park.size} · Est. {park.established}</Text>
        </View>
      </View>

      {selected && (
        <View style={[styles.selectedBorder]} />
      )}
    </Animated.View>
    </Pressable>
  );
}

function LockedParkCard({ name, state, description }: {
  name: string;
  state: string;
  description: string;
}) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedImageWrap}>
        <View style={styles.lockedImagePlaceholder}>
          <Feather name="lock" size={28} color={Colors.textMuted} />
        </View>
      </View>
      <View style={styles.parkCardBody}>
        <View>
          <Text style={[styles.parkName, styles.lockedText]}>{name.replace(" National Park", "")}</Text>
          <Text style={styles.parkState}>{state}</Text>
        </View>
        <Text style={[styles.parkDesc, styles.lockedText]} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.comingSoonBadge}>
          <Feather name="lock" size={10} color={Colors.textMuted} />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

export default function ParkSelectScreen() {
  const insets = useSafeAreaInsets();
  const { character, setActivePark } = useGame();
  const [selectedPark, setSelectedPark] = useState<ParkId>("yellowstone");
  const [isConfirming, setIsConfirming] = useState(false);

  const headerOp = useSharedValue(0);
  const contentOp = useSharedValue(0);
  const bottomOp = useSharedValue(0);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 350 });
    contentOp.value = withDelay(120, withTiming(1, { duration: 350 }));
    bottomOp.value = withDelay(200, withTiming(1, { duration: 350 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOp.value }));
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomOp.value }));

  async function handleConfirm() {
    if (isConfirming) return;
    setIsConfirming(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setActivePark(selectedPark);
    router.replace("/(tabs)");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>
        <Text style={styles.title}>Choose Your Park</Text>
        <Text style={styles.subtitle}>
          Pick where{" "}
          <Text style={styles.highlightName}>{character?.name}</Text>
          {" "}begins their adventure
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          <Text style={styles.sectionLabel}>Available Parks</Text>

          {PARKS.map((park) => (
            <UnlockedParkCard
              key={park.id}
              park={park}
              selected={selectedPark === park.id}
              onSelect={() => {
                Haptics.selectionAsync();
                setSelectedPark(park.id);
              }}
            />
          ))}

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Coming Soon</Text>

          <View style={styles.lockedGrid}>
            {LOCKED_PARKS.map((park) => (
              <View key={park.name} style={styles.lockedGridItem}>
                <LockedParkCard {...park} />
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed CTA — opacity only, no entering */}
      <Animated.View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }, bottomStyle]}
      >
        <Pressable
          style={[styles.confirmBtn, isConfirming && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isConfirming}
        >
          <Feather name="map-pin" size={18} color={Colors.earthDark} />
          <Text style={styles.confirmBtnText}>
            {isConfirming ? "Loading..." : "Begin My Journey"}
          </Text>
        </Pressable>
      </Animated.View>
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
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
    marginTop: 8,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface,
  },
  stepDotActive: {
    backgroundColor: Colors.accent,
    width: 40,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  highlightName: {
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: -4,
  },
  // Unlocked card
  parkCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.surface,
    position: "relative",
  },
  parkCardSelected: {
    borderColor: Colors.accent,
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.accent,
    pointerEvents: "none",
  },
  parkImageWrap: {
    height: 160,
    position: "relative",
  },
  parkImage: {
    width: "100%",
    height: "100%",
  },
  parkImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  selectedCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  parkImageTextWrap: {
    position: "absolute",
    bottom: 12,
    left: 14,
  },
  unlockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unlockBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  parkCardBody: {
    padding: 14,
    gap: 8,
  },
  parkName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  parkState: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    marginTop: 1,
  },
  parkDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  parkMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  parkMetaText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  // Locked grid
  lockedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  lockedGridItem: {
    width: "47.5%",
  },
  lockedCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.surface,
    opacity: 0.55,
  },
  lockedImageWrap: {
    height: 90,
  },
  lockedImagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedText: {
    color: Colors.textMuted,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignSelf: "flex-start",
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Bottom
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  confirmBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.earthDark,
  },
});
