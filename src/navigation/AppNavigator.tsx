import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { RootStackParamList } from '../utils/types';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { BottomTabNavigator } from './BottomTabNavigator';
import { SplashScreen } from '../screens/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  // Clerk is the source of truth for auth — isSignedIn reacts immediately to
  // OAuth completions, email sign-in, and sign-outs without waiting on Firestore.
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { isLoading } = useAuthStore();

  // Show splash while Clerk is still loading its session from secure store
  if (!isLoaded || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {isSignedIn ? (
          <Stack.Screen name="Main" component={BottomTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
