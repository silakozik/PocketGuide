import React from "react";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { ProfileHeaderButton } from "@/src/components/navigation/ProfileHeaderButton";
import { theme } from "@/src/theme/tokens";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const headerShownDefault = useClientOnlyValue(false, true);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerShown: route.name === "map" ? false : headerShownDefault,
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamilySerif,
          fontWeight: "700",
          color: theme.colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
        headerLeft: () => <ProfileHeaderButton />,
        headerRight: () => null,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarLabel: t("nav.home"),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "house.fill", android: "home", web: "home" }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("nav.search"),
          tabBarLabel: t("nav.search"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: t("mobile.transferTitle"),
          tabBarLabel: t("nav.transfer"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "arrow.left.arrow.right", android: "directions", web: "swap_horiz" }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("nav.map"),
          tabBarLabel: t("nav.map"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "map.fill", android: "map", web: "map" }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="first-day"
        options={{
          title: "Rota",
          tabBarLabel: "Rota",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "star.fill", android: "star", web: "star" }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
