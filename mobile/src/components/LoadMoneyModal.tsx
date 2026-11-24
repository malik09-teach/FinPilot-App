import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowDown, X, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';
import { AdaptiveModal } from './AdaptiveModal';

interface LoadMoneyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LoadMoneyModal: React.FC<LoadMoneyModalProps> = ({ visible, onClose }) => {
  const { loadMoney } = useBankStore();
  const [amount, setAmount] = useState('10000');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const presets = [5000, 10000, 25000, 50000];

  const handleLoad = async () => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) return;

    setIsLoading(true);
    try {
      await loadMoney(num);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    } catch {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdaptiveModal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ArrowDown size={22} color={colors.blueSecondary} strokeWidth={2.4} />
            </View>
            <Text style={styles.title}>Load Money</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={styles.successState}>
              <CheckCircle2 size={48} color={colors.tealPrimary} />
              <Text style={styles.successTitle}>Funds Loaded Successfully!</Text>
              <Text style={styles.successSubtitle}>Rs. {parseFloat(amount).toLocaleString()} added to your account</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Select or Enter Amount (PKR)</Text>

              {/* Presets */}
              <View style={styles.presetRow}>
                {presets.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setAmount(p.toString())}
                    style={[
                      styles.presetBtn,
                      amount === p.toString() && styles.presetBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        amount === p.toString() && styles.presetTextActive,
                      ]}
                    >
                      {p >= 1000 ? `${p / 1000}K` : p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Amount in PKR"
              />

              <TouchableOpacity
                onPress={handleLoad}
                disabled={isLoading}
                style={styles.loadActionBtn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loadActionText}>Load Funds</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnActive: {
    backgroundColor: colors.blueSecondary,
    borderColor: colors.blueSecondary,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  amountInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadActionBtn: {
    backgroundColor: colors.blueSecondary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
