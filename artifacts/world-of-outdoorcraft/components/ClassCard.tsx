import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { CharacterClass, CharacterGender } from "@/context/GameContext";

export interface ClassInfo {
  id: CharacterClass;
  name: string;
  subtitle: string;
  description: string;
  abilities: string[];
  color: string;
  darkColor: string;
  icon: string;
  startingGear: string;
  questStyle: string;
  artImageMale: ImageSourcePropType;
  artImageFemale: ImageSourcePropType;
}

export const CLASS_DATA: ClassInfo[] = [
  {
    id: "ranger",
    name: "Ranger",
    subtitle: "Protector of the Wild",
    description: "Patrol the wilderness, protect the park, and master wildlife management.",
    abilities: ["Wildlife Census", "Fire Watch", "Trail Clearance"],
    color: Colors.rangerColor,
    darkColor: "#2D7A3A",
    icon: "shield",
    startingGear: "Ranger Badge",
    questStyle: "Patrol & Protection",
    artImageMale: require("@/assets/images/class_ranger_m.png"),
    artImageFemale: require("@/assets/images/class_ranger_f.png"),
  },
  {
    id: "hiker",
    name: "Hiker",
    subtitle: "Explorer of Summits",
    description: "Conquer trails, reach epic viewpoints, and chase sunrises and sunsets.",
    abilities: ["Speed March", "Endurance Boost", "Summit Sight"],
    color: Colors.hikerColor,
    darkColor: "#1A6B99",
    icon: "navigation",
    startingGear: "Trail Compass",
    questStyle: "GPS Navigation",
    artImageMale: require("@/assets/images/class_hiker_m.png"),
    artImageFemale: require("@/assets/images/class_hiker_f.png"),
  },
  {
    id: "naturalist",
    name: "Naturalist",
    subtitle: "Student of Nature",
    description: "Discover rare plants, unlock ecological secrets, and become one with nature.",
    abilities: ["Plant ID", "Ecosystem Scan", "Microbe Analysis"],
    color: Colors.naturalistColor,
    darkColor: "#6B3E9C",
    icon: "book-open",
    startingGear: "Field Guide",
    questStyle: "Photography & ID",
    artImageMale: require("@/assets/images/class_naturalist_m.png"),
    artImageFemale: require("@/assets/images/class_naturalist_f.png"),
  },
  {
    id: "tracker",
    name: "Tracker",
    subtitle: "Hunter of Signs",
    description: "Hunt and photograph elusive wildlife, read the land, and master the wild.",
    abilities: ["Animal Sense", "Track Reading", "Stealth Approach"],
    color: Colors.trackerColor,
    darkColor: "#A04D1E",
    icon: "eye",
    startingGear: "Tracker Spyglass",
    questStyle: "Wildlife Photography",
    artImageMale: require("@/assets/images/class_tracker_m.png"),
    artImageFemale: require("@/assets/images/class_tracker_f.png"),
  },
];

interface ClassCardProps {
  classInfo: ClassInfo;
  selected: boolean;
  gender: CharacterGender;
  onSelect: () => void;
  onGenderToggle: (gender: CharacterGender) => void;
}

export function ClassCard({ classInfo, selected, gender, onSelect }: ClassCardProps) {
  const scale = useSharedValue(1);

  // Use Pressable → Animated.View (NOT AnimatedPressable) so touches always register
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const artImage = gender === "male" ? classInfo.artImageMale : classInfo.artImageFemale;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onSelect}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.card,
          selected && { borderColor: classInfo.color, borderWidth: 2 },
          animStyle,
        ]}
      >
        {/* Character art */}
        <View style={[styles.artWrap, { backgroundColor: classInfo.darkColor }]}>
          <Image source={artImage} style={styles.artImage} resizeMode="contain" />
          <View style={styles.artFade} />

          {selected && (
            <View style={[styles.selectedBadge, { backgroundColor: classInfo.color }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          )}

          <View style={styles.headerBar}>
            <View style={[styles.iconCircle, { backgroundColor: `${classInfo.color}35` }]}>
              <Feather name={classInfo.icon as any} size={20} color={classInfo.color} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.className}>{classInfo.name}</Text>
              <Text style={[styles.classSubtitle, { color: classInfo.color }]}>
                {classInfo.subtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.description}>{classInfo.description}</Text>

          <View style={styles.abilitiesRow}>
            {classInfo.abilities.map((ability) => (
              <View key={ability} style={[styles.abilityBadge, { backgroundColor: `${classInfo.color}18` }]}>
                <Text style={[styles.abilityText, { color: classInfo.color }]}>{ability}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.gearBadge, { backgroundColor: `${classInfo.color}12`, borderColor: `${classInfo.color}30` }]}>
            <Feather name="package" size={12} color={classInfo.color} />
            <Text style={[styles.gearText, { color: classInfo.color }]}>
              Starting Gear: {classInfo.startingGear}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  artWrap: {
    height: 340,
    position: "relative",
    overflow: "hidden",
  },
  artImage: {
    width: "100%",
    height: "100%",
  },
  artFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  className: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#fff" },
  classSubtitle: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },

  cardBody: { padding: 14, gap: 10 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  abilitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  abilityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  abilityText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  gearBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, alignSelf: "flex-start",
  },
  gearText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
