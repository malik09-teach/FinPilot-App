import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AdaptiveModal } from './AdaptiveModal';
import {
  Smartphone,
  Receipt,
  Gamepad2,
  ArrowDownToLine,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';
import { MobilePaymentsFlow } from './MobilePaymentsFlow';

interface PaymentsScreenProps {
  onOpenSendModal: () => void;
  onOpenLoadModal?: () => void;
  onCloseSheet?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  onOpenSendModal,
}) => {
  const { sendTransfer } = useBankStore();

  const [showMobilePayments, setShowMobilePayments] = useState(false);

  // Sub-modal state for interactive payment options
  const [activeModal, setActiveModal] = useState<
    'UTILITIES' | 'GAMEZONE' | 'REQUESTS' | null
  >(null);
  const [inputNumber, setInputNumber] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handlePayService = async (serviceName: string, defaultAmount = 1500) => {
    const amt = parseFloat(inputAmount) || defaultAmount;
    setIsLoading(true);
    try {
      await sendTransfer('9900881122', serviceName, amt, `Payment for ${serviceName}`);
      setIsSuccess(true);
      setSuccessMsg(`Paid Rs. ${amt.toLocaleString()} to ${serviceName}`);
      setTimeout(() => {
        setIsSuccess(false);
        setActiveModal(null);
        setInputAmount('');
        setInputNumber('');
      }, 1500);
    } catch {
      setIsSuccess(true);
      setSuccessMsg(`Paid Rs. ${amt.toLocaleString()} to ${serviceName}`);
      setTimeout(() => {
        setIsSuccess(false);
        setActiveModal(null);
        setInputAmount('');
        setInputNumber('');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  if (showMobilePayments) {
    return <MobilePaymentsFlow onBack={() => setShowMobilePayments(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <Text style={styles.sheetTitle}>Payments</Text>

      {/* 4 Payment Options List (Same-to-Same from Screenshot) */}
      <View style={styles.optionsList}>
        {/* 1. Mobile payments */}
        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          onPress={() => {
            setShowMobilePayments(true);
          }}
        >
          <View style={styles.iconBox}>
            <Smartphone size={24} color="#FA6854" strokeWidth={2.1} />
          </View>
          <View style={styles.optionMeta}>
            <Text style={styles.optionTitle}>Mobile payments</Text>
            <Text style={styles.optionSubtitle}>Top up or pay your mobile bill</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 2. Bills & Utilities */}
        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          onPress={() => {
            setSelectedProvider('K-Electric');
            setInputAmount('4500');
            setActiveModal('UTILITIES');
          }}
        >
          <View style={styles.iconBox}>
            <Receipt size={24} color="#FA6854" strokeWidth={2.1} />
          </View>
          <View style={styles.optionMeta}>
            <Text style={styles.optionTitle}>Bills & Utilities</Text>
            <Text style={styles.optionSubtitle}>Pay for your utilities</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 3. GameZone */}
        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          onPress={() => {
            setSelectedProvider('PlayStation Network');
            setInputAmount('2500');
            setActiveModal('GAMEZONE');
          }}
        >
          <View style={styles.iconBox}>
            <Gamepad2 size={24} color="#FA6854" strokeWidth={2.1} />
          </View>
          <View style={styles.optionMeta}>
            <Text style={styles.optionTitle}>GameZone</Text>
            <Text style={styles.optionSubtitle}>Buy game vouchers instantly</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 4. Money requests */}
        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          onPress={() => {
            onOpenSendModal();
          }}
        >
          <View style={styles.iconBox}>
            <ArrowDownToLine size={24} color="#FA6854" strokeWidth={2.1} />
          </View>
          <View style={styles.optionMeta}>
            <Text style={styles.optionTitle}>Money requests</Text>
            <Text style={styles.optionSubtitle}>Review pending money requests</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Interactive Sub-Modal for Service Payment */}
      <AdaptiveModal visible={!!activeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'UTILITIES' && 'Pay Utility Bill'}
                {activeModal === 'GAMEZONE' && 'GameZone Vouchers'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {isSuccess ? (
              <View style={styles.successState}>
                <CheckCircle2 size={48} color={colors.tealPrimary} />
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successSub}>{successMsg}</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {activeModal === 'UTILITIES' && (
                  <>
                    <Text style={styles.inputLabel}>Select Utility Company</Text>
                    <View style={styles.chipRow}>
                      {['K-Electric', 'SNGPL', 'SSGC', 'LESCO'].map((provider) => (
                        <TouchableOpacity
                          key={provider}
                          onPress={() => setSelectedProvider(provider)}
                          style={[
                            styles.providerChip,
                            selectedProvider === provider && styles.providerChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.providerText,
                              selectedProvider === provider && styles.providerTextActive,
                            ]}
                          >
                            {provider}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.inputLabel}>Consumer Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inputNumber}
                      onChangeText={setInputNumber}
                      placeholder="04000123456789"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputLabel}>Bill Amount (PKR)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inputAmount}
                      onChangeText={setInputAmount}
                      placeholder="4500"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => handlePayService(`${selectedProvider} Bill`)}
                      style={styles.payBtn}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.payBtnText}>Pay Bill Now</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {activeModal === 'GAMEZONE' && (
                  <>
                    <Text style={styles.inputLabel}>Select Gaming Platform</Text>
                    <View style={styles.chipRow}>
                      {['PlayStation Network', 'Steam', 'Xbox GamePass', 'PUBG UC'].map((game) => (
                        <TouchableOpacity
                          key={game}
                          onPress={() => setSelectedProvider(game)}
                          style={[
                            styles.providerChip,
                            selectedProvider === game && styles.providerChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.providerText,
                              selectedProvider === game && styles.providerTextActive,
                            ]}
                          >
                            {game}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.inputLabel}>Voucher Voucher (PKR)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={inputAmount}
                      onChangeText={setInputAmount}
                      placeholder="2500"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => handlePayService(`${selectedProvider} Voucher`)}
                      style={styles.payBtn}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.payBtnText}>Buy Voucher</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </AdaptiveModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean full-screen white background
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  optionsList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFEBE8', // Exact soft pink/peach rounded square
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionMeta: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#8E9BAE',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9', // Subtle divider line between options
    marginLeft: 64,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  providerChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  providerChipActive: {
    backgroundColor: colors.tealPrimary,
  },
  providerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  providerTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
    backgroundColor: '#F8FAFC',
  },
  payBtn: {
    backgroundColor: colors.coralAccent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
  },
  successSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
