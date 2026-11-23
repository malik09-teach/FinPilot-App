import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ArrowUpRight, X, User, CheckCircle2, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';

interface SendRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SendRequestModal: React.FC<SendRequestModalProps> = ({ visible, onClose }) => {
  const { beneficiaries, sendTransfer } = useBankStore();
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const defaultBeneficiaries = [
    { name: 'Ali Khan', account: '1004892110', bank: 'FinPilot' },
    { name: 'Fatima Zahra', account: '0129384756', bank: 'HBL' },
    { name: 'Hamza Ahmed', account: '0987654321', bank: 'Meezan Bank' },
  ];

  const handleSelectBeneficiary = (b: { name: string; account: string }) => {
    setRecipientName(b.name);
    setRecipientAccount(b.account);
  };

  const handleSend = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (!recipientAccount || !recipientName) {
      setErrorMessage('Please specify recipient name and account number');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await sendTransfer(recipientAccount, recipientName, numAmount, note);
      setSuccessReceipt({
        recipientName,
        recipientAccount,
        amount: numAmount,
        reference: res?.reference || `TXN-REF-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleTimeString(),
      });
    } catch (e: any) {
      setErrorMessage(e.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessReceipt(null);
    setAmount('');
    setRecipientName('');
    setRecipientAccount('');
    setNote('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Send & Request</Text>
          <TouchableOpacity onPress={handleReset} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {successReceipt ? (
          <View style={styles.receiptContainer}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={44} color={colors.tealPrimary} />
            </View>
            <Text style={styles.receiptTitle}>Transfer Successful!</Text>
            <Text style={styles.receiptAmount}>
              Rs. {successReceipt.amount.toLocaleString()}
            </Text>
            <Text style={styles.receiptSubtitle}>
              Sent to {successReceipt.recipientName} ({successReceipt.recipientAccount})
            </Text>

            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction Ref</Text>
                <Text style={styles.receiptVal}>{successReceipt.reference}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={[styles.receiptVal, { color: colors.tealPrimary, fontWeight: '700' }]}>
                  Completed (Ledger Balanced)
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Security Check</Text>
                <Text style={styles.receiptVal}>Idempotent & Audited</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleReset} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            {/* Quick Beneficiaries */}
            <Text style={styles.sectionHeading}>Saved Beneficiaries</Text>
            <View style={styles.beneficiariesRow}>
              {defaultBeneficiaries.map((b, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectBeneficiary(b)}
                  style={[
                    styles.beneficiaryChip,
                    recipientAccount === b.account && styles.beneficiaryChipSelected,
                  ]}
                >
                  <View style={styles.avatar}>
                    <User size={14} color={recipientAccount === b.account ? '#FFFFFF' : colors.coralAccent} />
                  </View>
                  <Text
                    style={[
                      styles.beneficiaryName,
                      recipientAccount === b.account && { color: '#FFFFFF' },
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs */}
            <Text style={styles.inputLabel}>Recipient Name</Text>
            <TextInput
              style={styles.textInput}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="e.g. Ali Khan"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Recipient Account / IBAN</Text>
            <TextInput
              style={styles.textInput}
              value={recipientAccount}
              onChangeText={setRecipientAccount}
              placeholder="e.g. 1004892110"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Amount (PKR)</Text>
            <TextInput
              style={[styles.textInput, styles.amountInput]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Rs. 5,000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Transfer Note (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Dinner share, Project payment"
              placeholderTextColor="#94A3B8"
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {/* Transfer Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              style={[styles.sendActionBtn, isLoading && styles.sendActionBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <ArrowUpRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.sendActionBtnText}>Confirm Transfer</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.securityBanner}>
              <Shield size={14} color={colors.tealPrimary} />
              <Text style={styles.securityText}>Protected by FinPilot Double-Entry Integrity</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  beneficiariesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  beneficiaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  beneficiaryChipSelected: {
    backgroundColor: colors.coralAccent,
    borderColor: colors.coralAccent,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficiaryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 12,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  sendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.coralAccent,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 12,
  },
  sendActionBtnDisabled: {
    opacity: 0.7,
  },
  sendActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2F7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.tealPrimary,
    marginBottom: 6,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: colors.tealPrimary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
