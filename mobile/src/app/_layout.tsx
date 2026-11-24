import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopOrTablet = isWeb && width > 520;

  // Frame height matching desktop viewport
  const frameHeight = Math.min(height - 40, 860);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {isDesktopOrTablet ? (
        // -------------------------------------------------------------------
        // DEDICATED WEB PHONE EMULATOR (Everything strictly inside the frame)
        // -------------------------------------------------------------------
        <View style={styles.webEmulatorBackground}>
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
