import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  compact?: boolean;
}

export function XPBar({ currentXP, maxXP, level, compact = false }: XPBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const totalXPForLevel = currentXP + (maxXP > 0 ? 0 : 0);
  const progress = maxXP > 0 ? Math.min(currentXP / (currentXP + maxXP), 1) : 1;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBarBg}>
          <Animated.View
            style={[styles.compactBarFill, { width: widthInterpolation }]}
          />
        </View>
        <Text style={styles.compactLabel}>
          Lv {level}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.xpInfo}>
          <Text style={styles.xpLabel}>Experience Points</Text>
          <Text style={styles.xpNumbers}>
            {currentXP.toLocaleString()} / {(currentXP + maxXP).toLocaleString()} XP
          </Text>
        </View>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width: widthInterpolation }]}>
          <View style={styles.barShine} />
        </Animated.View>
      </View>
      <Text style={styles.nextLevel}>
        {maxXP > 0 ? `${maxXP} XP to Level ${level + 1}` : "Max Level!"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 7,
  },
  levelBadge: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.accentDark,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: 7,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  xpNumbers: {
    fontSize: 9,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.xpBg,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.xpFill,
    overflow: "hidden",
  },
  barShine: {
    position: "absolute",
    top: 1,
    left: 3,
    right: 3,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  nextLevel: {
    fontSize: 7,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "right",
  },
  // Compact
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.xpBg,
    overflow: "hidden",
  },
  compactBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.xpFill,
  },
  compactLabel: {
    fontSize: 11,
    color: Colors.accent,
    fontFamily: "Inter_700Bold",
    minWidth: 32,
  },
});
