import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const BG_IMAGE = require("@/assets/images/title_bg.png");
const LOGO = require("@/assets/images/logo_transparent.png");

export default function TitleScreen() {
  const insets = useSafeAreaInsets();

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleY.value = withDelay(200, withTiming(0, { duration: 800 }));
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    bottomOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));

    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2600 }),
        withTiming(0, { duration: 2600 })
      ),
      -1,
      false
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value + floatY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomOpacity.value }));

  function handleBegin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/character-creation");
  }

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">

      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 36 },
        ]}
      >
        {/* ── LOGO — floats in the upper third ── */}
        <Animated.View style={[styles.logoWrap, titleStyle]}>
          <Image
            source={LOGO}
            style={{ width: 380, height: 193 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Flexible gap pushes tagline + button toward bottom */}
        <View style={{ flex: 1 }} />

        {/* ── TAGLINE ── */}
        <Animated.View style={[styles.taglineWrap, taglineStyle]}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.tagline}>
            Forge Your Legend in the American Wilderness
          </Text>
        </Animated.View>

        {/* ── BUTTON ── */}
        <Animated.View style={[styles.bottomSection, bottomStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.beginBtn,
              pressed && styles.beginBtnPressed,
            ]}
            onPress={handleBegin}
          >
            <View style={styles.beginBtnInner}>
              <View style={styles.beginBtnShine} />
              <View style={styles.beginBtnRidge} />
              <Text style={styles.beginBtnText}>BEGIN ADVENTURE</Text>
            </View>
          </Pressable>
          <Text style={styles.callText}>A new ranger answers the call</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  inner: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 20,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 168,
  },
  logoImage: {
    width: 390,
    height: 260,
    /* screen blend: black pixels become fully transparent */
    mixBlendMode: "screen",
  },

  /* ── TAGLINE ── */
  taglineWrap: {
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    width: 50,
    height: 1,
    backgroundColor: "rgba(200,134,10,0.5)",
  },
  dividerDiamond: {
    width: 7,
    height: 7,
    backgroundColor: "#C8860A",
    transform: [{ rotate: "45deg" }],
    opacity: 0.85,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    color: "#FFF4D6",
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 22,
    paddingHorizontal: 16,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  /* ── BUTTON ── */
  bottomSection: {
    alignItems: "center",
    gap: 12,
  },
  beginBtn: {
    width: "100%",
    borderRadius: 12,
    shadowColor: "#D4920A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  beginBtnPressed: { opacity: 0.84 },
  beginBtnInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E09010",
    paddingVertical: 19,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6B3A08",
    borderTopColor: "#C8780A",
    overflow: "hidden",
    position: "relative",
  },
  beginBtnShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,210,100,0.28)",
  },
  beginBtnRidge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  beginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#2A1004",
    letterSpacing: 2.5,
    textShadowColor: "rgba(255,200,80,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  callText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    color: "rgba(255,240,200,0.90)",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.80)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
