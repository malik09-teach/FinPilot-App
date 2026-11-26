import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Delete, Lock, ShieldCheck, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import { AdaptiveModal } from './AdaptiveModal';

interface PinScreenProps {
  visible: boolean;
  onSuccess: () => void;
  onSubmitPin?: (pin: string) => void;
  onCancel?: () => void;
  pinLength?: number;
  title?: string;
  subtitle?: string;
  requireApiVerification?: boolean;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  visible,
  onSuccess,
  onSubmitPin,
  onCancel,
  pinLength = 4,
  title = 'Enter Security PIN',
  subtitle = 'Provide your 4-digit PIN to authenticate',
  requireApiVerification = false,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyPress = async (val: string) => {
    if (pin.length >= pinLength) return;
    const newPin = pin + val;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === pinLength) {
      if (onSubmitPin) {
        const submitted = newPin;
        setPin('');
        onSubmitPin(submitted);
        return;
      }
      if (requireApiVerification) {
        setIsVerifying(true);
        try {
          const res = await api.verifyPin(newPin);
          if (res?.isValid) {
            setPin('');
            onSuccess();
          } else {
            setErrorMsg('Incorrect PIN. Try 1234');
            setPin('');
          }
        } catch {
          // Fallback check
          if (newPin === '1234' || newPin === '12333') {
            setPin('');
            onSuccess();
          } else {
            setErrorMsg('Incorrect PIN. Demo PIN is 12333');
            setPin('');
          }
        } finally {
          setIsVerifying(false);
        }
      } else {
        // Simple local check
        if (newPin === '1234' || newPin === '12333') {
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 150);
        } else {
          setErrorMsg('Incorrect PIN. Demo PIN is 12333');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleQuickDemo = () => {
    setPin('1234');
    setTimeout(() => {
      setPin('');
      onSuccess();
    }, 200);
  };

  return (
    <AdaptiveModal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.contentCard}>
          {/* Header icon */}
          <View style={styles.iconCircle}>
            <Lock size={26} color={colors.tealPrimary} strokeWidth={2.4} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* 4 PIN Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    isFilled && styles.pinDotFilled,
                    errorMsg ? styles.pinDotError : null,
                  ]}
                />
              );
            })}
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {isVerifying ? <Text style={styles.verifyingText}>Verifying credentials...</Text> : null}

          {/* Keypad */}
          <View style={styles.keypadGrid}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((btn, bIdx) => {
                  if (btn === '') {
                    return <View key={bIdx} style={styles.keypadBtnPlaceholder} />;
                  }
                  if (btn === 'del') {
                    return (
                      <TouchableOpacity
                        key={bIdx}
                        onPress={handleDelete}
                        style={styles.keypadBtn}
                      >
                        <Delete size={22} color={colors.textDark} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={bIdx}
                      onPress={() => handleKeyPress(btn)}
                      style={styles.keypadBtn}
                    >
                      <Text style={styles.keypadBtnText}>{btn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Demo unlock helper (only shown when not in strict onSubmitPin mode) */}
          {!onSubmitPin ? (
            <TouchableOpacity onPress={handleQuickDemo} style={styles.demoUnlockBtn}>
              <Sparkles size={14} color={colors.tealPrimary} />
              <Text style={styles.demoUnlockText}>Quick Demo Auto-Unlock (1234)</Text>
            </TouchableOpacity>
          ) : onCancel ? (
            <TouchableOpacity
              onPress={() => {
                setPin('');
                onCancel();
              }}
              style={styles.demoUnlockBtn}
              accessibilityLabel="Cancel PIN entry"
            >
              <Text style={styles.demoUnlockText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2F7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: colors.tealPrimary,
    borderColor: colors.tealPrimary,
  },
  pinDotError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  verifyingText: {
    color: colors.tealPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnPlaceholder: {
    width: 72,
    height: 72,
  },
  keypadBtnText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.textDark,
  },
  demoUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E2F7EE',
  },
  demoUnlockText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tealPrimary,
  },
});
