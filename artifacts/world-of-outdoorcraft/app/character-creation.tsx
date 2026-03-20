import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CLASS_DATA, ClassCard } from "@/components/ClassCard";
import Colors from "@/constants/colors";
import { CharacterClass, CharacterGender, useGame } from "@/context/GameContext";

export default function CharacterCreationScreen() {
  const insets = useSafeAreaInsets();
  const { createCharacter } = useGame();
  const { switchMode } = useLocalSearchParams<{ switchMode?: string }>();
  const isSwitching = switchMode === "1";
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [gender, setGender] = useState<CharacterGender>("male");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const selectedClassData = CLASS_DATA.find((c) => c.id === selectedClass);
  const canContinue = selectedClass !== null && name.trim().length >= 2;
  const accentColor = selectedClassData?.color ?? Colors.accent;

  // Fade-in animations that don't block pointer events
  const headerOp = useSharedValue(0);
  const nameOp = useSharedValue(0);
  const genderOp = useSharedValue(0);
  const cardsOp = useSharedValue(0);
  const bottomOp = useSharedValue(0);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 350 });
    nameOp.value = withDelay(80, withTiming(1, { duration: 350 }));
    genderOp.value = withDelay(160, withTiming(1, { duration: 350 }));
    cardsOp.value = withDelay(220, withTiming(1, { duration: 350 }));
    bottomOp.value = withDelay(300, withTiming(1, { duration: 350 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));
  const nameStyle = useAnimatedStyle(() => ({ opacity: nameOp.value }));
  const genderStyle = useAnimatedStyle(() => ({ opacity: genderOp.value }));
  const cardsStyle = useAnimatedStyle(() => ({ opacity: cardsOp.value }));
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomOp.value }));

  function handleSelectClass(cls: CharacterClass) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClass(cls);
  }

  function handleGenderSelect(g: CharacterGender) {
    if (g === gender) return;
    Haptics.selectionAsync();
    setGender(g);
  }

  async function handleBeginJourney() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters");
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > 20) {
      setNameError("Name must be 20 characters or less");
      return;
    }
    if (!selectedClass) return;
    setNameError("");
    setIsCreating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createCharacter(trimmed, selectedClass, gender);
    if (isSwitching) {
      router.replace("/(tabs)");
    } else {
      router.replace("/park-select");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
          </View>
          <Text style={styles.title}>
            {isSwitching ? "Switch Character" : "Create Your Hero"}
          </Text>
          <Text style={styles.subtitle}>
            {isSwitching
              ? "Choose a new class and name — your quests reset fresh"
              : "Name your adventurer, pick your look, and choose a class"}
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name input */}
          <Animated.View style={[styles.section, nameStyle]}>
            <Text style={styles.sectionLabel}>Your Name</Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.nameInput,
                nameError ? styles.nameInputError : null,
                selectedClassData ? { borderColor: `${accentColor}60` } : null,
              ]}
              placeholder="Enter your hero's name..."
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); setNameError(""); }}
              maxLength={20}
              returnKeyType="done"
            />
            <View style={styles.nameRow}>
              {nameError
                ? <Text style={styles.errorText}>{nameError}</Text>
                : <Text style={styles.nameTip}>2–20 characters</Text>}
              <Text style={styles.charCount}>{name.length}/20</Text>
            </View>
          </Animated.View>

          {/* Gender picker */}
          <Animated.View style={[styles.section, genderStyle]}>
            <Text style={styles.sectionLabel}>Choose Your Look</Text>
            <View style={styles.genderPicker}>
              <Pressable
                style={[
                  styles.genderOption,
                  gender === "male" && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => handleGenderSelect("male")}
              >
                <Text style={styles.genderIcon}>♂</Text>
                <Text style={[styles.genderLabel, gender === "male" && styles.genderLabelActive]}>Male</Text>
                {gender === "male" && <Feather name="check" size={14} color="#fff" />}
              </Pressable>

              <Pressable
                style={[
                  styles.genderOption,
                  gender === "female" && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => handleGenderSelect("female")}
              >
                <Text style={styles.genderIcon}>♀</Text>
                <Text style={[styles.genderLabel, gender === "female" && styles.genderLabelActive]}>Female</Text>
                {gender === "female" && <Feather name="check" size={14} color="#fff" />}
              </Pressable>
            </View>
          </Animated.View>

          {/* Class selection */}
          <Animated.View style={cardsStyle}>
            <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Choose Your Class</Text>
            {CLASS_DATA.map((cls) => (
              <ClassCard
                key={cls.id}
                classInfo={cls}
                selected={selectedClass === cls.id}
                gender={gender}
                onSelect={() => handleSelectClass(cls.id)}
                onGenderToggle={handleGenderSelect}
              />
            ))}
          </Animated.View>
        </ScrollView>

        {/* Fixed CTA — no entering animation, just opacity fade */}
        <Animated.View
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }, bottomStyle]}
        >
          <Pressable
            style={[
              styles.beginBtn,
              canContinue
                ? { backgroundColor: accentColor }
                : styles.beginBtnDisabled,
            ]}
            onPress={handleBeginJourney}
            disabled={!canContinue || isCreating}
          >
            {isCreating ? (
              <Text style={styles.beginBtnText}>Creating Hero...</Text>
            ) : canContinue ? (
              <>
                <Text style={styles.beginBtnText}>
                  Begin Journey as {selectedClassData?.name}
                </Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </>
            ) : (
              <Text style={[styles.beginBtnText, styles.hintText]}>
                {!name.trim() && !selectedClass
                  ? "Enter a name & choose a class"
                  : !name.trim()
                  ? "Enter your hero's name above"
                  : "Choose your class below"}
              </Text>
            )}
          </Pressable>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { marginBottom: 10, marginTop: 4, alignSelf: "flex-start", padding: 4 },
  stepRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: Colors.surface },
  stepDotActive: { backgroundColor: Colors.accent, width: 40 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", color: Colors.textPrimary, marginBottom: 5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted,
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8,
  },

  nameInput: {
    backgroundColor: Colors.backgroundCard, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15, fontSize: 17,
    fontFamily: "Inter_600SemiBold", color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.surface,
  },
  nameInputError: { borderColor: Colors.error },
  nameRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  nameTip: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 12, color: Colors.error, fontFamily: "Inter_400Regular" },
  charCount: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },

  genderPicker: { flexDirection: "row", gap: 12 },
  genderOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.surface, backgroundColor: Colors.backgroundCard,
  },
  genderIcon: { fontSize: 20, color: Colors.textSecondary },
  genderLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.textSecondary },
  genderLabelActive: { color: "#fff" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.surface,
  },
  beginBtn: {
    borderRadius: 16, height: 56, alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 10,
  },
  beginBtnDisabled: { backgroundColor: Colors.surface, opacity: 0.55 },
  beginBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  hintText: { color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
});
