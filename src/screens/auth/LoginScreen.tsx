import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { AuthStackParamList } from '../../utils/types';
import { useAuthStore } from '../../store/authStore';
import { InputField, PrimaryButton } from '../../components/common';
import { Colors } from '../../theme';
import { isValidEmail, isValidPassword } from '../../utils/helpers';

// Simple icon components
function MailIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 13, borderWidth: 1.5, borderColor: Colors.mutedForeground, borderRadius: 2 }} />
    </View>
  );
}

function LockIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 10, borderWidth: 1.5, borderColor: Colors.mutedForeground, borderRadius: 2, marginTop: 4 }} />
      <View style={{ width: 10, height: 7, borderWidth: 1.5, borderColor: Colors.mutedForeground, borderRadius: 5, borderBottomWidth: 0, marginBottom: -1 }} />
    </View>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#warm-up-browser
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function LoginScreen({ navigation }: Props) {
  useWarmUpBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { setError } = useAuthStore();
  const { signIn, setActive, isLoaded } = useSignIn();

  // Clerk OAuth hooks for Google and Apple
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' });

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError(null);
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleFlow();
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('[Google OAuth Error]', err);
      Alert.alert('Google Sign-In', 'An error occurred during Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    try {
      setLoading(true);
      setError(null);
      const { createdSessionId, setActive: setOAuthActive } = await startAppleFlow();
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('[Apple OAuth Error]', err);
      Alert.alert('Apple Sign-In', 'An error occurred during Apple sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else {
      const { valid, message } = isValidPassword(password);
      if (!valid) newErrors.password = message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate() || !isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      // Attempt sign-in via Clerk
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        // Activate the session
        await setActive({ session: result.createdSessionId });
      } else {
        // MFA or other steps required — handle gracefully
        Alert.alert('Login', 'Additional verification required. Please check your email.');
      }
    } catch (err: any) {
      const clerkCode = err?.errors?.[0]?.code ?? '';
      const msg =
        clerkCode === 'form_password_incorrect' || clerkCode === 'form_identifier_not_found'
          ? 'Invalid email or password'
          : clerkCode === 'too_many_requests'
          ? 'Too many attempts. Try again later.'
          : 'Login failed. Please try again.';
      setError(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f14', '#0a0a0a']} style={styles.container}>
      {/* Background glows */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to find your next game</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon={<MailIcon />}
            />

            <InputField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
              secureTextEntry={!showPassword}
              autoComplete="password"
              error={errors.password}
              leftIcon={<LockIcon />}
              rightIcon={
                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialButtons}>
            <PrimaryButton
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={loading}
              variant="outline"
            />
            <PrimaryButton
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              loading={loading}
              variant="outline"
            />
          </View>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(190,255,0,0.08)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: '33%',
    left: 0,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(190,255,0,0.04)',
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.mutedForeground,
  },
  form: { gap: 16 },
  showHide: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  forgotContainer: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  socialButtons: { gap: 12 },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    color: Colors.mutedForeground,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
