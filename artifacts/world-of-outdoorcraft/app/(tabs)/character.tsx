import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CLASS_DATA } from "@/components/ClassCard";
import { XPBar } from "@/components/XPBar";
import Colors from "@/constants/colors";
import { CharacterClass, CharacterGender, CharacterProfile, useGame } from "@/context/GameContext";

const CLASS_ART: Record<CharacterClass, Record<CharacterGender, any>> = {
  ranger:     { male: require("@/assets/images/class_ranger_m.png"),     female: require("@/assets/images/class_ranger_f.png") },
  hiker:      { male: require("@/assets/images/class_hiker_m.png"),      female: require("@/assets/images/class_hiker_f.png") },
  naturalist: { male: require("@/assets/images/class_naturalist_m.png"), female: require("@/assets/images/class_naturalist_f.png") },
  tracker:    { male: require("@/assets/images/class_tracker_m.png"),    female: require("@/assets/images/class_tracker_f.png") },
};

const CLASS_COLOR_MAP: Record<CharacterClass, string> = {
  ranger: Colors.rangerColor,
  hiker: Colors.hikerColor,
  naturalist: Colors.naturalistColor,
  tracker: Colors.trackerColor,
};

const CLASS_DARK_COLOR_MAP: Record<CharacterClass, string> = {
  ranger: "#2D7A3A",
  hiker: "#1A6B99",
  naturalist: "#6B3E9C",
  tracker: "#A04D1E",
};

export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const { character, quests, resetGame, allProfiles, switchToProfile } = useGame();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!character) return null;

  const classData = CLASS_DATA.find((c) => c.id === character.class)!;
  const classColor = CLASS_COLOR_MAP[character.class];
  const classDarkColor = CLASS_DARK_COLOR_MAP[character.class];

  const myQuests = quests.filter(
    (q) => q.class === "all" || q.class === character.class
  );
  const completedCount = myQuests.filter((q) => q.status === "completed").length;
  const totalCount = myQuests.length;

  function handleReset() {
    Alert.alert(
      "Start New Game",
      "This will delete ALL heroes and progress forever. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Over",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetGame();
            router.replace("/title");
          },
        },
      ]
    );
  }

  async function handleSwitchProfile(id: string) {
    setShowDropdown(false);
    if (id === character.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await switchToProfile(id);
  }

  function handleAddNew() {
    setShowDropdown(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/character-creation", params: { switchMode: "1" } });
  }

  const statItems = [
    { icon: "map-pin", label: "Locations Visited", value: character.totalLocationsVisited, color: Colors.sky },
    { icon: "camera", label: "Photos Taken", value: character.totalPhotos, color: Colors.naturalistColor },
    { icon: "book-open", label: "Lore Scrolls", value: character.loreScrollsFound, color: Colors.accent },
    { icon: "award", label: "Quests Done", value: completedCount, color: Colors.success },
  ];

  return (
    <View style={styles.container}>
      {/* ── Profile dropdown modal ── */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDropdown(false)}>
          <View style={[styles.dropdown, { top: insets.top + 56 }]}>
            <Text style={styles.dropdownTitle}>My Heroes</Text>

            {allProfiles.map((profile) => {
              const pColor = CLASS_COLOR_MAP[profile.class];
              const isActive = profile.id === character.id;
              return (
                <Pressable
                  key={profile.id}
                  style={[styles.profileRow, isActive && styles.profileRowActive]}
                  onPress={() => handleSwitchProfile(profile.id)}
                >
                  <View style={[styles.profileAvatarWrap, { backgroundColor: `${pColor}25` }]}>
                    <Image
                      source={CLASS_ART[profile.class][profile.gender as CharacterGender]}
                      style={styles.profileAvatar}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={[styles.profileClass, { color: pColor }]}>
                      {CLASS_DATA.find(c => c.id === profile.class)?.name} · Lv {profile.level}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: pColor }]}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <Pressable style={styles.addNewBtn} onPress={handleAddNew}>
              <Feather name="plus-circle" size={18} color={Colors.accent} />
              <Text style={styles.addNewText}>Add New Hero</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Fixed top bar with dropdown trigger ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.topBarTitle}>My Character</Text>
        <Pressable
          style={[styles.profilesBtn, { borderColor: `${classColor}50` }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowDropdown(true);
          }}
        >
          <Feather name="users" size={14} color={classColor} />
          <Text style={[styles.profilesBtnText, { color: classColor }]}>
            {allProfiles.length} {allProfiles.length === 1 ? "Hero" : "Heroes"}
          </Text>
          <Feather name="chevron-down" size={13} color={classColor} />
        </Pressable>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Character hero card */}
        <Animated.View style={[styles.heroCard, { backgroundColor: classDarkColor }]}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              <Image
                source={CLASS_ART[character.class][(character.gender ?? "male") as CharacterGender]}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={[styles.avatarGenderBadge, { backgroundColor: classColor }]}>
                <Text style={styles.avatarGenderText}>
                  {(character.gender ?? "male") === "male" ? "♂" : "♀"}
                </Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.characterName}>{character.name}</Text>
              <View style={[styles.classChip, { backgroundColor: `${classColor}30` }]}>
                <Text style={[styles.classChipText, { color: classColor }]}>
                  {classData.name}
                </Text>
              </View>
              <Text style={styles.classSubtitle}>{classData.subtitle}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <XPBar
            currentXP={character.xp}
            maxXP={character.xpToNextLevel}
            level={character.level}
          />
        </Animated.View>

        {/* Stats grid */}
        <Animated.View style={styles.section}>
          <Text style={styles.sectionTitle}>Adventure Stats</Text>
          <View style={styles.statsGrid}>
            {statItems.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { borderColor: `${stat.color}30` }]}>
                <Feather name={stat.icon as any} size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Quest progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quest Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {completedCount}/{totalCount} Quests Completed
              </Text>
              <Text style={[styles.progressPct, { color: classColor }]}>
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: classColor,
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Class abilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Abilities</Text>
          <View style={styles.abilitiesCard}>
            {classData.abilities.map((ability, i) => (
              <View key={ability} style={styles.abilityRow}>
                <View style={[styles.abilityIcon, { backgroundColor: `${classColor}20` }]}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={16}
                    color={classColor}
                  />
                </View>
                <View style={styles.abilityInfo}>
                  <Text style={styles.abilityName}>{ability}</Text>
                  <Text style={styles.abilityUnlocked}>
                    {character.level >= i + 1 ? "Unlocked" : `Unlock at Lv ${i + 1}`}
                  </Text>
                </View>
                {character.level >= i + 1 ? (
                  <Feather name="check" size={16} color={Colors.success} />
                ) : (
                  <Feather name="lock" size={14} color={Colors.textMuted} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Park info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Park</Text>
          <View style={styles.parkCard}>
            <View style={styles.parkHeader}>
              <Feather name="map" size={20} color={Colors.accent} />
              <Text style={styles.parkName}>Yellowstone National Park</Text>
            </View>
            <Text style={styles.parkDesc}>
              The world's first national park, home to geysers, hot springs,
              wolves, grizzly bears, and millions of acres of pristine wilderness.
            </Text>
            <View style={styles.parkTagsRow}>
              {["Wyoming", "Free Starter Park", "19 Quests"].map((tag) => (
                <View key={tag} style={styles.parkTag}>
                  <Text style={styles.parkTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Reset */}
        <View>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Feather name="refresh-cw" size={16} color={Colors.error} />
            <Text style={styles.resetText}>Reset All Characters</Text>
          </Pressable>
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
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatarWrap: {
    width: 80,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarGenderBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGenderText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  characterName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  classChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  classChipText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  classSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  progressCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  progressPct: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  abilitiesCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  abilityRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  abilityIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  abilityUnlocked: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  parkCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  parkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  parkName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  parkDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  parkTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  parkTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  parkTagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    marginTop: 4,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.error,
  },
  // ── Top bar ──────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  profilesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  profilesBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Dropdown modal ───────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dropdown: {
    position: "absolute",
    right: 16,
    width: 280,
    backgroundColor: "#1A3322",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  dropdownTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  profileRowActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  profileAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  profileClass: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  activeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "rgba(245,166,35,0.10)",
    justifyContent: "center",
  },
  addNewText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
});
