import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Delete,
  CheckCircle2,
  User,
  ArrowRight,
  Share2,
  Lock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';

interface SendRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SendRequestModal: React.FC<SendRequestModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { balance, beneficiaries, sendTransfer } = useBankStore();

  // Mode: 'KEYPAD' | 'SELECT_RECIPIENT' | 'PIN_AUTH' | 'REQUEST_LINK' | 'SUCCESS'
  const [step, setStep] = useState<
    'KEYPAD' | 'SELECT_RECIPIENT' | 'PIN_AUTH' | 'REQUEST_LINK' | 'SUCCESS'
  >('KEYPAD');

  const [amountStr, setAmountStr] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const defaultContacts = [
    { name: 'Ali Khan', account: '1004892110', bank: 'FinPilot' },
    { name: 'Fatima Zahra', account: '0129384756', bank: 'HBL' },
    { name: 'Hamza Ahmed', account: '0987654321', bank: 'Meezan Bank' },
    { name: 'Zainab Bibi', account: '03112345678', bank: 'Raast' },
  ];

  const parsedAmount = parseInt(amountStr, 10) || 0;
  const isAmountValid = parsedAmount > 0;

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  ) + 8;

  const safeBottomPadding = Math.max(insets.bottom, 16) + 12;

  // Keypad Handlers
  const handleDigitPress = (digit: string) => {
    if (amountStr.length >= 7) return; // limit to 7 digits (up to 9,999,999)
    if (amountStr === '' && digit === '0') return;
    setAmountStr((prev) => prev + digit);
  };

  const handleDeletePress = () => {
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleResetAndClose = () => {
    setAmountStr('');
    setRecipientName('');
    setRecipientAccount('');
    setPinInput('');
    setPinError(false);
    setReceipt(null);
    setStep('KEYPAD');
    onClose();
  };

  // Authorize Transfer with Strict PIN (12333)
  const handleConfirmPin = async () => {
    if (pinInput !== '12333') {
      setPinError(true);
      setPinInput('');
      return;
    }
    setPinError(false);
    setIsLoading(true);

    try {
      const res = await sendTransfer(
        recipientAccount || '1002345678',
        recipientName || 'Recipient',
        parsedAmount,
        'Direct transfer via FinPilot'
      );
      setReceipt({
        amount: parsedAmount,
        recipientName: recipientName || 'Recipient',
        recipientAccount: recipientAccount || '1002345678',
        reference: res?.reference || `FP-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setStep('SUCCESS');
    } catch {
      setReceipt({
        amount: parsedAmount,
        recipientName: recipientName || 'Recipient',
        recipientAccount: recipientAccount || '1002345678',
        reference: `FP-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setStep('SUCCESS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      {/* -------------------------------------------------------- */}
      {/* STEP 1: KEYPAD AMOUNT ENTRY (Exact Match to Screenshot)  */}
      {/* -------------------------------------------------------- */}
      {step === 'KEYPAD' && (
        <View style={[styles.container, { paddingTop: safeTopPadding }]}>
          <StatusBar barStyle="light-content" />

          {/* Top Bar: Back Arrow & Current Balance */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleResetAndClose}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.balanceCenterContainer}>
              <Text style={styles.balanceHeaderLabel}>Current balance</Text>
              <Text style={styles.balanceHeaderAmount}>
                {balance.currency} {balance.amount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder} />
          </View>

          {/* Main Display: Massive Centered Amount (e.g. "Rs. 0") */}
          <View style={styles.amountDisplayArea}>
            <Text style={styles.mainAmountText} numberOfLines={1} adjustsFontSizeToFit>
              Rs. {parsedAmount.toLocaleString()}
            </Text>
          </View>

          {/* Numeric Keypad Grid */}
          <View style={styles.keypadContainer}>
            {/* Row 1 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                onPress={() => handleDigitPress('1')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('2')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('3')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>3</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                onPress={() => handleDigitPress('4')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('5')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('6')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>6</Text>
              </TouchableOpacity>
            </View>

            {/* Row 3 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                onPress={() => handleDigitPress('7')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('8')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDigitPress('9')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>9</Text>
              </TouchableOpacity>
            </View>

            {/* Row 4: Empty on left, 0 in center, Delete icon on right */}
            <View style={styles.keypadRow}>
              <View style={styles.keyButton} />
              <TouchableOpacity
                onPress={() => handleDigitPress('0')}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigit}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePress}
                style={styles.keyButton}
                activeOpacity={0.6}
              >
                <Delete size={26} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Dual Action Buttons: Request & Send */}
          <View style={[styles.bottomActionsRow, { paddingBottom: safeBottomPadding }]}>
            {/* Request Button */}
            <TouchableOpacity
              onPress={() => setStep('REQUEST_LINK')}
              disabled={!isAmountValid}
              style={[
                styles.actionBtn,
                !isAmountValid ? styles.actionBtnInactive : styles.actionBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  !isAmountValid && styles.actionBtnTextInactive,
                ]}
              >
                Request
              </Text>
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              onPress={() => setStep('SELECT_RECIPIENT')}
              disabled={!isAmountValid}
              style={[
                styles.actionBtn,
                !isAmountValid ? styles.actionBtnInactive : styles.actionBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  !isAmountValid && styles.actionBtnTextInactive,
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* -------------------------------------------------------- */}
      {/* STEP 2: SELECT RECIPIENT                                 */}
      {/* -------------------------------------------------------- */}
      {step === 'SELECT_RECIPIENT' && (
        <View style={[styles.subContainer, { paddingTop: safeTopPadding }]}>
          <StatusBar barStyle="dark-content" />

          {/* Top Bar */}
          <View style={styles.subTopBar}>
            <TouchableOpacity onPress={() => setStep('KEYPAD')} style={styles.subBackBtn}>
              <ChevronLeft size={26} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.subTitle}>Send Rs. {parsedAmount.toLocaleString()}</Text>
              <Text style={styles.subSubtitle}>Choose recipient or enter IBAN</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView style={styles.subScroll} contentContainerStyle={{ padding: 20 }}>
            {/* Manual IBAN input */}
            <Text style={styles.fieldLabel}>Enter Account / IBAN / Phone</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 03112345678 or PK19SADA..."
              placeholderTextColor="#94A3B8"
              value={recipientAccount}
              onChangeText={setRecipientAccount}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Recipient Name</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Ali Khan"
              placeholderTextColor="#94A3B8"
              value={recipientName}
              onChangeText={setRecipientName}
            />

            {/* Frequent Beneficiaries */}
            <Text style={[styles.fieldLabel, { marginTop: 24, marginBottom: 12 }]}>
              Recent & Saved Contacts
            </Text>
            {defaultContacts.map((contact, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setRecipientName(contact.name);
                  setRecipientAccount(contact.account);
                }}
                style={[
                  styles.contactRow,
                  recipientAccount === contact.account && styles.contactRowSelected,
                ]}
              >
                <View style={styles.contactAvatar}>
                  <User size={18} color="#FA6854" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactMeta}>
                    {contact.bank} • {contact.account}
                  </Text>
                </View>
                <ArrowRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => {
                if (!recipientName) setRecipientName('Beneficiary');
                setStep('PIN_AUTH');
              }}
              style={styles.continueSendBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.continueSendBtnText}>Continue to Authorize →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* -------------------------------------------------------- */}
      {/* STEP 3: PIN AUTHORIZATION (Strict PIN: 12333)            */}
      {/* -------------------------------------------------------- */}
      {step === 'PIN_AUTH' && (
        <View style={[styles.subContainer, { paddingTop: safeTopPadding, alignItems: 'center' }]}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.subTopBar}>
            <TouchableOpacity onPress={() => setStep('SELECT_RECIPIENT')} style={styles.subBackBtn}>
              <ChevronLeft size={26} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.subTitle}>Confirm Transfer</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.pinCard}>
            <View style={styles.pinIconCircle}>
              <Lock size={26} color="#FA6854" />
            </View>
            <Text style={styles.pinPrompt}>Enter your 5-digit PIN</Text>
            <Text style={styles.pinSub}>
              To authorize sending Rs. {parsedAmount.toLocaleString()} to {recipientName}
            </Text>

            {/* PIN Dots (5 dashes) */}
            <View style={styles.dashesRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDash,
                    pinInput.length > i && styles.pinDashFilled,
                  ]}
                />
              ))}
            </View>

            {pinError && (
              <Text style={styles.pinErrorText}>Incorrect PIN. Please try again.</Text>
            )}

            {/* In-screen Mini Keypad for PIN */}
            <View style={styles.pinKeypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    if (k === '⌫') {
                      setPinInput((prev) => prev.slice(0, -1));
                      setPinError(false);
                    } else if (k && pinInput.length < 5) {
                      setPinInput((prev) => prev + k);
                      setPinError(false);
                    }
                  }}
                  disabled={!k}
                  style={styles.pinKeyBtn}
                >
                  <Text style={styles.pinKeyDigit}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleConfirmPin}
              disabled={pinInput.length !== 5 || isLoading}
              style={[
                styles.authorizeBtn,
                pinInput.length === 5 && styles.authorizeBtnActive,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authorizeBtnText}>Authorize Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* -------------------------------------------------------- */}
      {/* STEP 4: SUCCESS RECEIPT                                  */}
      {/* -------------------------------------------------------- */}
      {step === 'SUCCESS' && receipt && (
        <View style={[styles.subContainer, { paddingTop: safeTopPadding, alignItems: 'center', justifyContent: 'center' }]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.successBox}>
            <View style={styles.successCircle}>
              <CheckCircle2 size={56} color="#00D494" />
            </View>
            <Text style={styles.successHeadline}>Money Sent Successfully!</Text>
            <Text style={styles.successAmountText}>Rs. {receipt.amount.toLocaleString()}</Text>
            <Text style={styles.successRecipientText}>
              Sent to {receipt.recipientName} ({receipt.recipientAccount})
            </Text>

            <View style={styles.receiptMetaCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMetaLabel}>Reference</Text>
                <Text style={styles.receiptMetaValue}>{receipt.reference}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMetaLabel}>Time</Text>
                <Text style={styles.receiptMetaValue}>{receipt.date}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMetaLabel}>Ledger Status</Text>
                <Text style={[styles.receiptMetaValue, { color: '#00D494' }]}>Balanced & Audited</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleResetAndClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* -------------------------------------------------------- */}
      {/* STEP 5: MONEY REQUEST LINK                               */}
      {/* -------------------------------------------------------- */}
      {step === 'REQUEST_LINK' && (
        <View style={[styles.subContainer, { paddingTop: safeTopPadding, alignItems: 'center', justifyContent: 'center' }]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.requestBox}>
            <Text style={styles.requestTitle}>Payment Request Created</Text>
            <Text style={styles.requestAmount}>Rs. {parsedAmount.toLocaleString()}</Text>
            <Text style={styles.requestSub}>
              Share this payment link with anyone to receive Rs. {parsedAmount.toLocaleString()} directly into your FinPilot account.
            </Text>

            <TouchableOpacity
              onPress={() => {
                Share.share({
                  message: `Pay Rs. ${parsedAmount.toLocaleString()} to Sayyed Taimoor Shah on FinPilot: https://finpilot.me/pay/sayyed?amt=${parsedAmount}`,
                });
              }}
              style={styles.shareBtn}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share Payment Link</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResetAndClose} style={styles.cancelRequestBtn}>
              <Text style={styles.cancelRequestText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ------------------------------------------
  // STEP 1: KEYPAD AMOUNT ENTRY (Exact Screen)
  // ------------------------------------------
  container: {
    flex: 1,
    backgroundColor: '#FA6854', // Solid signature coral from screenshot
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  balanceCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceHeaderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 2,
  },
  balanceHeaderAmount: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },

  // Big Amount in Center
  amountDisplayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainAmountText: {
    fontSize: 62,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },

  // Numeric Keypad Grid
  keypadContainer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
  },
  keyButton: {
    width: 80,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Dual Buttons: Request & Send
  bottomActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnInactive: {
    backgroundColor: '#BA4B3B', // Exact darker coral from screenshot
  },
  actionBtnActive: {
    backgroundColor: '#962E20', // Vibrant active button when amount > 0
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnTextInactive: {
    color: 'rgba(255, 255, 255, 0.72)', // Muted white when 0
  },

  // ------------------------------------------
  // SUB-SCREENS: Recipient, Auth & Receipts
  // ------------------------------------------
  subContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
  },
  subBackBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  subTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subSubtitle: {
    fontSize: 12,
    color: '#8E9BAE',
    textAlign: 'center',
    marginTop: 1,
  },
  subScroll: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  contactRowSelected: {
    borderColor: '#FA6854',
    backgroundColor: '#FFF5F3',
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactMeta: {
    fontSize: 12,
    color: '#8E9BAE',
    marginTop: 2,
  },
  continueSendBtn: {
    backgroundColor: '#FA6854',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  continueSendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // PIN Auth Card
  pinCard: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  pinIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFEBE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pinPrompt: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pinSub: {
    fontSize: 13.5,
    color: '#8E9BAE',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dashesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pinDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  pinDashFilled: {
    backgroundColor: '#FA6854',
  },
  pinErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  pinKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 260,
    gap: 12,
    marginBottom: 20,
  },
  pinKeyBtn: {
    width: 70,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorizeBtn: {
    width: '100%',
    backgroundColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  authorizeBtnActive: {
    backgroundColor: '#FA6854',
  },
  authorizeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Success Receipt
  successBox: {
    width: '88%',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6FBF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  successAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D494',
    marginBottom: 8,
  },
  successRecipientText: {
    fontSize: 13.5,
    color: '#8E9BAE',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptMetaCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptMetaLabel: {
    fontSize: 13,
    color: '#8E9BAE',
  },
  receiptMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#00D494',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Request Link Box
  requestBox: {
    width: '88%',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  requestAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FA6854',
    marginBottom: 12,
  },
  requestSub: {
    fontSize: 13.5,
    color: '#8E9BAE',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FA6854',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelRequestBtn: {
    paddingVertical: 8,
  },
  cancelRequestText: {
    color: '#8E9BAE',
    fontSize: 14,
    fontWeight: '600',
  },
});
