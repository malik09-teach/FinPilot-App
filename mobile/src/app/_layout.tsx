import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShieldCheck, Zap, Sparkles, Smartphone } from 'lucide-react-native';

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 860;
  const isTablet = isWeb && width > 520 && width < 860;

  // Responsive frame height
  const frameHeight = Math.min(height - 40, 880);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {isDesktop ? (
        // -------------------------------------------------------------------
        // DESKTOP RESPONSIVE LAYOUT (Left: Branding & Info, Right: Phone UI)
        // -------------------------------------------------------------------
        <View style={styles.desktopContainer}>
          {/* Left Hero & App Showcase Panel */}
          <View style={styles.desktopHeroPanel}>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>FinPilot • Web Edition</Text>
            </View>

            <Text style={styles.heroTitle}>
              Next-Gen <Text style={styles.heroHighlight}>Digital Banking</Text> for Pakistan 🇵🇰
            </Text>

            <Text style={styles.heroSubtitle}>
              Experience seamless instant transfers, virtual & physical card management,
              and Raast payments with double-entry ledger security.
            </Text>

            {/* Feature Pills */}
            <View style={styles.featureGrid}>
              <View style={styles.featurePill}>
                <Zap size={16} color="#00D494" />
                <Text style={styles.featureText}>Instant Raast Transfers</Text>
              </View>
              <View style={styles.featurePill}>
                <ShieldCheck size={16} color="#0084FF" />
                <Text style={styles.featureText}>ACID Ledger & PIN Auth</Text>
              </View>
              <View style={styles.featurePill}>
                <Sparkles size={16} color="#FA6854" />
                <Text style={styles.featureText}>Login PIN: 12333</Text>
              </View>
            </View>

            <View style={styles.desktopFooterNote}>
              <Smartphone size={15} color="#94A3B8" />
              <Text style={styles.footerNoteText}>
                Use the interactive mobile preview on the right to test the app.
              </Text>
            </View>
          </View>

          {/* Right Phone Chassis Container */}
          <View style={styles.phoneChassisWrapper}>
            <View style={[styles.phoneChassis, { height: frameHeight }]}>
              {/* Speaker Notch */}
              <View style={styles.speakerNotch} />

              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#F6F7F9' },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
        </View>
      ) : isTablet ? (
        // -------------------------------------------------------------------
        // TABLET WEB (Centered Phone Chassis)
        // -------------------------------------------------------------------
        <View style={styles.tabletContainer}>
          <View style={[styles.phoneChassis, { height: frameHeight, maxWidth: 430 }]}>
            <View style={styles.speakerNotch} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F6F7F9' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
      ) : (
        // -------------------------------------------------------------------
        // MOBILE NATIVE & MOBILE WEB (100% Full Screen)
        // -------------------------------------------------------------------
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F6F7F9' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Desktop Web
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0A0F1D', // Deep midnight fintech background
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 60,
    minHeight: '100vh' as any,
  },
  desktopHeroPanel: {
    maxWidth: 440,
    gap: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 212, 148, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 148, 0.25)',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D494',
  },
  brandBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00D494',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  heroHighlight: {
    color: '#00D494',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  featureGrid: {
    gap: 10,
    marginTop: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  desktopFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  footerNoteText: {
    fontSize: 12.5,
    color: '#64748B',
  },

  // Phone Chassis
  phoneChassisWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneChassis: {
    width: 410,
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 7,
    borderColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 24,
  },
  speakerNotch: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 70,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    zIndex: 9999,
  },

  // Tablet Container
  tabletContainer: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: '100vh' as any,
  },
});
