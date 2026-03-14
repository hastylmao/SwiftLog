import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/store/AppContext';
import { theme } from './src/theme';

import AuthScreen from './src/screens/auth/AuthScreen';
import OnboardingApiKey from './src/screens/onboarding/OnboardingApiKey';
import OnboardingProfile from './src/screens/onboarding/OnboardingProfile';
import OnboardingCalories from './src/screens/onboarding/OnboardingCalories';
import OnboardingSplit from './src/screens/onboarding/OnboardingSplit';
import HomeScreen from './src/screens/home/HomeScreen';
import LoggerMainScreen from './src/screens/log/LoggerMainScreen';
import FoodLogScreen from './src/screens/log/FoodLogScreen';
import WorkoutLogScreen from './src/screens/log/WorkoutLogScreen';
import WaterLogScreen from './src/screens/log/WaterLogScreen';
import SocialScreen from './src/screens/social/SocialScreen';
import UserProfileScreen from './src/screens/social/UserProfileScreen';
import AIChatScreen from './src/screens/chat/AIChatScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import ProfileSettingsScreen from './src/screens/profile/ProfileSettingsScreen';
import CompleteHistoryScreen from './src/screens/profile/CompleteHistoryScreen';
import SplitEditorScreen from './src/screens/profile/SplitEditorScreen';
import AISettingsScreen from './src/screens/profile/AISettingsScreen';
import SecuritySettingsScreen from './src/screens/profile/SecuritySettingsScreen';
import LegalScreen from './src/screens/profile/LegalScreen';
import AchievementsScreen from './src/screens/achievements/AchievementsScreen';
import SupplementsLogScreen from './src/screens/log/SupplementsLogScreen';
import CardioLogScreen from './src/screens/log/CardioLogScreen';
import VitalsLogScreen from './src/screens/log/VitalsLogScreen';
import GroceryListScreen from './src/screens/log/GroceryListScreen';
import PumpCardScreen from './src/screens/profile/PumpCardScreen';
import ScanScreen from './src/screens/scan/ScanScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LogStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const AchievementsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ScanStack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.accent,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    notification: theme.colors.accent,
  },
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AIChat" component={AIChatScreen} />
    </HomeStack.Navigator>
  );
}

function LogStackScreen() {
  return (
    <LogStack.Navigator screenOptions={{ headerShown: false }}>
      <LogStack.Screen name="LogMain" component={LoggerMainScreen} />
      <LogStack.Screen name="FoodLog" component={FoodLogScreen} />
      <LogStack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
      <LogStack.Screen name="WaterLog" component={WaterLogScreen} />
      <LogStack.Screen name="SupplementsLog" component={SupplementsLogScreen} />
      <LogStack.Screen name="CardioLog" component={CardioLogScreen} />
      <LogStack.Screen name="VitalsLog" component={VitalsLogScreen} />
      <LogStack.Screen name="GroceryList" component={GroceryListScreen} />
    </LogStack.Navigator>
  );
}

function SocialStackScreen() {
  return (
    <SocialStack.Navigator screenOptions={{ headerShown: false }}>
      <SocialStack.Screen name="SocialMain" component={SocialScreen} />
      <SocialStack.Screen name="UserProfile" component={UserProfileScreen} />
    </SocialStack.Navigator>
  );
}

function ChatStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatMain" component={AIChatScreen} />
    </ChatStack.Navigator>
  );
}

function AchievementsStackScreen() {
  return (
    <AchievementsStack.Navigator screenOptions={{ headerShown: false }}>
      <AchievementsStack.Screen name="AchievementsMain" component={AchievementsScreen} />
    </AchievementsStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <ProfileStack.Screen name="CompleteHistory" component={CompleteHistoryScreen} />
      <ProfileStack.Screen name="SplitEditor" component={SplitEditorScreen} />
      <ProfileStack.Screen name="AISettings" component={AISettingsScreen} />
      <ProfileStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <ProfileStack.Screen name="Legal" component={LegalScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="PumpCard" component={PumpCardScreen} />
    </ProfileStack.Navigator>
  );
}

function ScanStackScreen() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="ScanMain" component={ScanScreen} />
    </ScanStack.Navigator>
  );
}

const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Log: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  Scan: { focused: 'scan', unfocused: 'scan-outline' },
  Chat: { focused: 'chatbubble-ellipses', unfocused: 'chatbubble-ellipses-outline' },
  Social: { focused: 'people', unfocused: 'people-outline' },
  Achievements: { focused: 'trophy', unfocused: 'trophy-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

function TabIcon({ focused, iconName, color }: { focused: boolean; iconName: string; color: string }) {
  return (
    <View style={tabStyles.iconWrapper}>
      {focused && (
        <LinearGradient
          colors={['#4A90FF', '#5A5AFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tabStyles.activeIndicator}
        />
      )}
      {focused && <View style={tabStyles.glowEffect} />}
      <Ionicons name={iconName as any} size={22} color={color} />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Platform.OS === 'android'
    ? Math.max(insets.bottom, 18)
    : Math.max(insets.bottom, 28);
  const tabBarHeight = 54 + bottomSpacing;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10,10,15,0.92)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: bottomSpacing,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#4A90FF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <TabIcon focused={focused} iconName={iconName} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen
        name="Log"
        component={LogStackScreen}
        options={{ popToTopOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Log', { screen: 'LogMain' });
          },
        })}
      />
      <Tab.Screen name="Scan" component={ScanStackScreen} />
      <Tab.Screen name="Chat" component={ChatStackScreen} />
      <Tab.Screen name="Social" component={SocialStackScreen} />
      <Tab.Screen name="Achievements" component={AchievementsStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, user, loading, initialized } = useApp();

  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const isLoggedIn = !!session;
  const hasCompletedOnboarding = user?.onboarding_completed === true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Group>
          <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
          <Stack.Screen name="OnboardingApiKey" component={OnboardingApiKey} />
          <Stack.Screen name="OnboardingCalories" component={OnboardingCalories} />
          <Stack.Screen name="OnboardingSplit" component={OnboardingSplit} />
        </Stack.Group>
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer theme={DarkTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  glowEffect: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74,144,255,0.15)',
  },
});
