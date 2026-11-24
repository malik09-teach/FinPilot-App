import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Lock, ShieldCheck, Sparkles, Check } from 'lucide-react-native';

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopOrTablet = isWeb && width > 520;
  const isWideDesktop = isWeb && width >= 860;
  const [copied, setCopied] = useState(false);

  // Frame height matching desktop viewport
  const frameHeight = Math.min(height - 40, 860);

  const handleCopyPin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('12333');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {isDesktopOrTablet ? (
        // -------------------------------------------------------------------
        // DEDICATED WEB PHONE EMULATOR (With PIN Card in Background)
        // -------------------------------------------------------------------
        <View style={styles.webEmulatorBackground}>
          <View style={styles.webEmulatorWrapper}>
            {/* Beside Emulator: Sleek Side Panel with PIN (on Wide Screens) */}
            {isWideDesktop && (
              <View style={styles.webSidePanel}>
                {/* Brand Row */}
                <View style={styles.brandRow}>
                  <View style={styles.brandLogoCircle}>
                    <Text style={styles.brandLogoText}>FP</Text>
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>FinPilot</Text>
                    <Text style={styles.brandSubtitle}>Web Emulator</Text>
                  </View>
                </View>

                {/* PIN Highlight Card */}
                <View style={styles.pinHighlightCard}>
                  <View style={styles.pinHeaderRow}>
                    <View style={styles.pinHeaderLeft}>
                      <Lock size={15} color="#FA6854" />
                      <Text style={styles.pinHeaderLabel}>APP LOGIN PIN</Text>
                    </View>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  </View>

                  {/* 5 PIN Digits */}
                  <View style={styles.pinDigitsContainer}>
                    {['1', '2', '3', '3', '3'].map((digit, idx) => (
                      <View key={idx} style={styles.pinDigitBox}>
                        <Text style={styles.pinDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.pinHintText}>
                    Enter this 5-digit PIN on the lock screen to unlock the application & authorize payments.
                  </Text>

                  {/* Copy PIN Button */}
                  <TouchableOpacity
                    style={styles.copyPinBtn}
                    onPress={handleCopyPin}
                    activeOpacity={0.8}
                  >
                    {copied ? (
                      <>
                        <Check size={16} color="#00D494" />
                        <Text style={[styles.copyPinText, { color: '#00D494' }]}>
                          PIN Copied (12333)
                        </Text>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} color="#FA6854" />
                        <Text style={styles.copyPinText}>Copy PIN (12333)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Account Details Box */}
                <View style={styles.specsBox}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Account title</Text>
                    <Text style={styles.specValue}>FinPilot</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Mobile Number</Text>
                    <Text style={styles.specValue}>0300-1234567</Text>
                  </View>
                  <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.specLabel}>UI Version</Text>
                    <Text style={styles.specValue}>v1.0 (Sadapay)</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Phone Emulator Column */}
            <View style={styles.phoneChassisColumn}>
              {/* Top Banner on medium screens */}
              {!isWideDesktop && (
                <View style={styles.topPinBanner}>
                  <Lock size={15} color="#FA6854" />
                  <Text style={styles.topPinBannerLabel}>PIN:</Text>
                  <Text style={styles.topPinBannerCode}>12333</Text>
                  <Text style={{ color: '#475569', marginHorizontal: 4 }}>•</Text>
                  <Text style={styles.topPinBannerLabel}>Account title:</Text>
                  <Text style={[styles.topPinBannerCode, { color: '#F1F5F9' }]}>FinPilot</Text>
                </View>
              )}

              {/* Phone Chassis Frame */}
              <View style={[styles.phoneChassis, { height: frameHeight }]}>
                {/* Speaker Notch */}
                <View style={styles.speakerNotch} />

                {/* App Screen Stack */}
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
        </View>
      ) : (
        // -------------------------------------------------------------------
        // MOBILE NATIVE & MOBILE BROWSER (100% Full Viewport)
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
  webEmulatorBackground: {
    flex: 1,
    backgroundColor: '#0A0E1A', // Deep midnight backdrop
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: '100vh' as any,
  },
  webEmulatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },

  // Side Panel on Desktop
  webSidePanel: {
    width: 320,
    backgroundColor: '#131B2E',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  brandLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FA6854',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // PIN Highlight Card
  pinHighlightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
    marginBottom: 20,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pinHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FA6854',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: 'rgba(0, 212, 148, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 148, 0.3)',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D494',
  },
  pinDigitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pinDigitBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#FA6854',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FA6854',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  pinDigitText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pinHintText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
  copyPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 104, 84, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 104, 84, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  copyPinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FA6854',
  },

  // Specs Box
  specsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },

  // Phone Column
  phoneChassisColumn: {
    alignItems: 'center',
  },
  topPinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  topPinBannerLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  topPinBannerCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FA6854',
    letterSpacing: 2,
  },

  // Phone Chassis
  phoneChassis: {
    width: 412,
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 30,
  },
  speakerNotch: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 70,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#1E293B',
    zIndex: 99999,
  },
});

