import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="parks">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Parks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet.clipboard.fill" }} />
        <Label>Quests</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="character">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Character</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inventory">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Inventory</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.backgroundMid,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.surface,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.backgroundMid }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="parks"
        options={{
          title: "Parks",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Quests",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet.clipboard.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="list" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: "Character",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bag.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="package" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
