import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete, Fingerprint } from 'lucide-react-native';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Support 5 digits as shown in reference image (5 dashes)
  const PIN_LENGTH = 5;

  const handleKeyPress = (val: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const nextPin = pin + val;
    setPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === PIN_LENGTH) {
      if (nextPin === '12333') {
        setPin('');
        onLoginSuccess();
      } else {
        setErrorMessage('Incorrect PIN. Please enter 12333');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleBiometricLogin = () => {
    setPin('');
    onLoginSuccess();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20) + 20,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Top Half: Title, 5 Dashes, and Forgot PIN */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Enter your login PIN</Text>

        {/* 5 Horizontal Dashes matching reference image */}
        <View style={styles.dashesRow}>
          {[0, 1, 2, 3, 4].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <View
                key={idx}
                style={[
                  styles.dash,
                  isFilled && styles.dashFilled,
                ]}
              />
            );
          })}
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>

      {/* Bottom Half: Clean Minimalist Numeric Keypad */}
      <View style={styles.keypadContainer}>
        {/* Row 1 */}
        <View style={styles.keyRow}>
          <TouchableOpacity onPress={() => handleKeyPress('1')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('2')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('3')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>3</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.keyRow}>
          <TouchableOpacity onPress={() => handleKeyPress('4')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('5')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('6')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>6</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.keyRow}>
          <TouchableOpacity onPress={() => handleKeyPress('7')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('8')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('9')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>9</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4: Fingerprint on left, 0 in center, Backspace on right */}
        <View style={styles.keyRow}>
          <TouchableOpacity
            onPress={handleBiometricLogin}
            style={styles.keyButton}
            activeOpacity={0.5}
          >
            <Fingerprint size={32} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKeyPress('0')} style={styles.keyButton} activeOpacity={0.5}>
            <Text style={styles.keyDigit}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.keyButton} activeOpacity={0.5}>
            <Delete size={28} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FA6854', // Exact signature coral background from screenshot
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: '18%',
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 28,
    textAlign: 'center',
  },
  dashesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 56,
  },
  dash: {
    width: 22,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Translucent white dash when unentered
  },
  dashFilled: {
    backgroundColor: '#FFFFFF', // Solid bright white dash when entered
    height: 5,
  },
  forgotButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  forgotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  errorText: {
    color: '#FFE2DE',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  keypadContainer: {
    width: '100%',
    paddingBottom: 24,
    gap: 28,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyButton: {
    width: 76,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    gap: 12,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F1F4F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalBtn: {
    backgroundColor: '#FA6854',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  otpPill: {
    backgroundColor: '#FFEBE8',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpPillLabel: {
    fontSize: 12,
    color: '#FA6854',
    fontWeight: '600',
  },
  otpPillVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FA6854',
    letterSpacing: 2,
  },
});
