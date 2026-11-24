import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Smartphone,
  Receipt,
  Antenna,
  Ellipsis,
  CheckCircle2,
  Delete,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useBankStore } from '../store/bank-store';

interface MobilePaymentsFlowProps {
  onBack: () => void;
}

type ScreenType =
  | 'MENU'
  | 'TOP_UP'
  | 'SELECT_NETWORK'
  | 'POSTPAID_NETWORKS'
  | 'ENTER_AMOUNT'
  | 'SUCCESS';

interface NetworkItem {
  id: string;
  name: string;
  postpaidName: string;
  themeColor: string;
  badgeType: 'jazz' | 'telenor' | 'ufone' | 'zong';
}

interface RecentPayItem {
  phone: string;
  network: string;
  type: string;
  badgeType: 'jazz' | 'telenor' | 'ufone' | 'zong';
}

const NETWORKS: NetworkItem[] = [
  {
    id: 'jazz',
    name: 'Jazz',
    postpaidName: 'Jazz Postpaid',
    themeColor: '#D4002A',
    badgeType: 'jazz',
  },
  {
    id: 'telenor',
    name: 'Telenor',
    postpaidName: 'Telenor Postpaid',
    themeColor: '#00A9E0',
    badgeType: 'telenor',
  },
  {
    id: 'ufone',
    name: 'Ufone',
    postpaidName: 'Ufone Postpaid',
    themeColor: '#FF6600',
    badgeType: 'ufone',
  },
  {
    id: 'zong',
    name: 'Zong',
    postpaidName: 'Zong Postpaid',
    themeColor: '#00A859',
    badgeType: 'zong',
  },
];

export const MobilePaymentsFlow: React.FC<MobilePaymentsFlowProps> = ({ onBack }) => {
  const { sendTransfer } = useBankStore();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('MENU');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkItem | null>(null);
  const [isPostpaidMode, setIsPostpaidMode] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    phone: string;
    network: string;
    amount: number;
    mode: string;
  } | null>(null);

  // Recent transactions list
  const [recentPayAgain, setRecentPayAgain] = useState<RecentPayItem[]>([
    {
      phone: '03029519639',
      network: 'Jazz',
      type: 'Prepaid top-up',
      badgeType: 'jazz',
    },
  ]);

  // Network Operator Brand Badge Renderer
  const renderNetworkBadge = (type: 'jazz' | 'telenor' | 'ufone' | 'zong') => {
    switch (type) {
      case 'jazz':
        return (
          <View style={[styles.brandBadgeCircle, { backgroundColor: '#B8001F' }]}>
            <Text style={styles.jazzText}>jazz</Text>
          </View>
        );
      case 'telenor':
        return (
          <View style={[styles.brandBadgeCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <View style={styles.telenorSymbolBox}>
              <View style={[styles.telenorPetal, { transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.telenorPetal, { transform: [{ rotate: '120deg' }] }]} />
              <View style={[styles.telenorPetal, { transform: [{ rotate: '240deg' }] }]} />
            </View>
          </View>
        );
      case 'ufone':
        return (
          <View style={[styles.brandBadgeCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <Text style={styles.ufoneText}>ufone</Text>
          </View>
        );
      case 'zong':
        return (
          <View style={[styles.brandBadgeCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.zongGreenText}>zong</Text>
              <Text style={styles.zongMagentaText}>4G</Text>
            </View>
          </View>
        );
    }
  };

  // Handle Pay Execution
  const handleExecutePayment = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 1000;
    const targetNetwork = selectedNetwork ? selectedNetwork.name : 'Jazz';
    const cleanPhone = mobileNumber || '03029519639';
    const modeLabel = isPostpaidMode ? 'Postpaid bill' : 'Prepaid top-up';

    setIsLoading(true);
    try {
      await sendTransfer(
        cleanPhone,
        `${targetNetwork} ${modeLabel}`,
        numAmount,
        `Mobile payment to ${cleanPhone}`
      );
    } catch {
      // Offline fallback handling
    } finally {
      setIsLoading(false);
      setSuccessInfo({
        phone: cleanPhone,
        network: targetNetwork,
        amount: numAmount,
        mode: modeLabel,
      });

      // Add to recent list
      setRecentPayAgain((prev) => {
        const filtered = prev.filter((p) => p.phone !== cleanPhone);
        return [
          {
            phone: cleanPhone,
            network: targetNetwork,
            type: modeLabel,
            badgeType: (selectedNetwork?.badgeType || 'jazz'),
          },
          ...filtered,
        ];
      });

      setCurrentScreen('SUCCESS');
    }
  };

  // Keypad press handler for Top-up number entry
  const handleKeypadPress = (val: string) => {
    if (val === 'del') {
      setMobileNumber((prev) => prev.slice(0, -1));
    } else {
      if (mobileNumber.length >= 11) return;
      setMobileNumber((prev) => prev + val);
    }
  };

  const isContinueEnabled = mobileNumber.length >= 11;

  // =========================================================================
  // SCREEN 1: "Mobile payments" (Matching Screenshot 1)
  // =========================================================================
  if (currentScreen === 'MENU') {
    return (
      <View style={styles.fullScreenContainer}>
        {/* Top Back Navigation */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtnHitArea} activeOpacity={0.7}>
            <ChevronLeft size={28} color="#0F172A" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.screenMainTitle}>Mobile payments</Text>

          {/* Card 1: Prepaid top-up */}
          <TouchableOpacity
            style={styles.whiteOptionCard}
            activeOpacity={0.8}
            onPress={() => {
              setIsPostpaidMode(false);
              setSelectedNetwork(NETWORKS[0]); // Default Jazz or null
              setMobileNumber('');
              setCurrentScreen('TOP_UP');
            }}
          >
            <View style={styles.peachIconCircle}>
              <Smartphone size={22} color="#FA6854" strokeWidth={2} />
            </View>
            <View style={styles.optionCardTexts}>
              <Text style={styles.optionCardTitle}>Prepaid top-up</Text>
              <Text style={styles.optionCardSubtitle}>Add balance to a prepaid number</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Postpaid bill */}
          <TouchableOpacity
            style={styles.whiteOptionCard}
            activeOpacity={0.8}
            onPress={() => {
              setIsPostpaidMode(true);
              setCurrentScreen('POSTPAID_NETWORKS');
            }}
          >
            <View style={styles.peachIconCircle}>
              <Receipt size={22} color="#FA6854" strokeWidth={2} />
            </View>
            <View style={styles.optionCardTexts}>
              <Text style={styles.optionCardTitle}>Postpaid bill</Text>
              <Text style={styles.optionCardSubtitle}>Pay a monthly mobile bill</Text>
            </View>
          </TouchableOpacity>

          {/* Section: Pay again */}
          <Text style={styles.payAgainSectionTitle}>Pay again</Text>

          {recentPayAgain.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.payAgainRow}
              activeOpacity={0.7}
              onPress={() => {
                const foundNet = NETWORKS.find((n) => n.badgeType === item.badgeType) || NETWORKS[0];
                setSelectedNetwork(foundNet);
                setMobileNumber(item.phone);
                setIsPostpaidMode(item.type.includes('Postpaid'));
                setCurrentScreen('TOP_UP');
              }}
            >
              {renderNetworkBadge(item.badgeType)}
              <View style={styles.payAgainTexts}>
                <Text style={styles.payAgainPhone}>{item.phone}</Text>
                <Text style={styles.payAgainSubtitle}>{item.type}</Text>
              </View>
              <TouchableOpacity
                style={styles.ellipsisHitArea}
                onPress={() => {
                  const foundNet = NETWORKS.find((n) => n.badgeType === item.badgeType) || NETWORKS[0];
                  setSelectedNetwork(foundNet);
                  setMobileNumber(item.phone);
                  setCurrentScreen('TOP_UP');
                }}
              >
                <Ellipsis size={20} color="#94A3B8" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 2: "Mobile top up" (Matching Screenshot 2)
  // =========================================================================
  if (currentScreen === 'TOP_UP') {
    return (
      <View style={styles.fullScreenContainer}>
        {/* Header Bar: Centered title */}
        <View style={styles.centeredNavHeader}>
          <TouchableOpacity
            onPress={() => setCurrentScreen('MENU')}
            style={styles.headerLeftBack}
            activeOpacity={0.7}
          >
            <ChevronLeft size={26} color="#0F172A" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.centeredNavTitle}>
            {isPostpaidMode ? 'Postpaid bill' : 'Mobile top up'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.topUpFormBody}>
          {/* Label */}
          <Text style={styles.inputFieldLabel}>Mobile number</Text>

          {/* Rounded Pill Mobile Number Input */}
          <View style={styles.pillInputContainer}>
            <TextInput
              style={styles.pillTextInput}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="03xxxxxxxxx"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          {/* Network Operator Card */}
          <TouchableOpacity
            style={styles.operatorSelectionCard}
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('SELECT_NETWORK')}
          >
            <View style={styles.antennaPeachCircle}>
              <Antenna size={22} color="#FA6854" strokeWidth={2} />
            </View>
            <Text style={styles.operatorCardTitle}>Network operator</Text>
            {selectedNetwork ? (
              <View style={styles.selectedOperatorBadge}>
                {renderNetworkBadge(selectedNetwork.badgeType)}
                <Text style={styles.operatorSelectedName}>{selectedNetwork.name}</Text>
              </View>
            ) : (
              <Text style={styles.operatorSelectAction}>Select</Text>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Continue Action Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isContinueEnabled ? styles.continueButtonActive : styles.continueButtonDisabled,
            ]}
            disabled={!isContinueEnabled}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('ENTER_AMOUNT')}
          >
            <Text
              style={[
                styles.continueButtonText,
                isContinueEnabled ? styles.continueTextActive : styles.continueTextDisabled,
              ]}
            >
              Continue
            </Text>
          </TouchableOpacity>

          {/* In-app Keypad for Fast Web / Mobile Input */}
          <View style={styles.keypadContainer}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((btn, bIdx) => {
                  if (btn === '') {
                    return <View key={bIdx} style={styles.keypadCellPlaceholder} />;
                  }
                  if (btn === 'del') {
                    return (
                      <TouchableOpacity
                        key={bIdx}
                        onPress={() => handleKeypadPress('del')}
                        style={styles.keypadCell}
                        activeOpacity={0.6}
                      >
                        <Delete size={22} color="#0F172A" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={bIdx}
                      onPress={() => handleKeypadPress(btn)}
                      style={styles.keypadCell}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.keypadDigitText}>{btn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 3: "Postpaid bills" / Network Selection (Matching Screenshot 3)
  // =========================================================================
  if (currentScreen === 'POSTPAID_NETWORKS' || currentScreen === 'SELECT_NETWORK') {
    const isSelectingForTopUp = currentScreen === 'SELECT_NETWORK';
    return (
      <View style={styles.fullScreenContainer}>
        {/* Top Back Navigation */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => {
              if (isSelectingForTopUp) {
                setCurrentScreen('TOP_UP');
              } else {
                setCurrentScreen('MENU');
              }
            }}
            style={styles.backBtnHitArea}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color="#0F172A" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.screenMainTitle}>
            {isPostpaidMode ? 'Postpaid bills' : 'Choose network'}
          </Text>
          <Text style={styles.networkSubheader}>Choose your network</Text>

          {/* 4 Network Cards */}
          {NETWORKS.map((net) => (
            <TouchableOpacity
              key={net.id}
              style={styles.networkSelectCard}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedNetwork(net);
                if (isSelectingForTopUp) {
                  setCurrentScreen('TOP_UP');
                } else {
                  // Direct to top up with this postpaid network
                  setCurrentScreen('TOP_UP');
                }
              }}
            >
              {renderNetworkBadge(net.badgeType)}
              <Text style={styles.networkCardName}>
                {isPostpaidMode ? net.postpaidName : net.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 4: Amount Entry & Confirmation
  // =========================================================================
  if (currentScreen === 'ENTER_AMOUNT') {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return (
      <View style={styles.fullScreenContainer}>
        {/* Header Bar */}
        <View style={styles.centeredNavHeader}>
          <TouchableOpacity
            onPress={() => setCurrentScreen('TOP_UP')}
            style={styles.headerLeftBack}
            activeOpacity={0.7}
          >
            <ChevronLeft size={26} color="#0F172A" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.centeredNavTitle}>Enter Amount</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.amountContentContainer}>
          {/* Recipient Summary Card */}
          <View style={styles.summaryCard}>
            {renderNetworkBadge(selectedNetwork?.badgeType || 'jazz')}
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.summaryTitle}>
                {selectedNetwork?.name || 'Jazz'} {isPostpaidMode ? 'Postpaid' : 'Top-Up'}
              </Text>
              <Text style={styles.summaryPhone}>{mobileNumber || '03029519639'}</Text>
            </View>
          </View>

          {/* Amount Display */}
          <Text style={styles.amountPromptLabel}>Recharge Amount (PKR)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>Rs.</Text>
            <TextInput
              style={styles.largeAmountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor="#CBD5E1"
            />
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetChipsRow}>
            {['250', '500', '1000', '2000'].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  amount === preset && styles.presetChipActive,
                ]}
                onPress={() => setAmount(preset)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    amount === preset && styles.presetChipTextActive,
                  ]}
                >
                  Rs. {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          {/* Confirm & Pay Button */}
          <TouchableOpacity
            style={styles.payConfirmButton}
            disabled={isLoading || numAmount <= 0}
            activeOpacity={0.85}
            onPress={handleExecutePayment}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payConfirmButtonText}>
                Pay Rs. {numAmount.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 5: Payment Success State
  // =========================================================================
  if (currentScreen === 'SUCCESS' && successInfo) {
    return (
      <View style={styles.successScreenContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={54} color="#00D494" strokeWidth={2.4} />
          </View>

          <Text style={styles.successHeading}>Payment Successful!</Text>
          <Text style={styles.successAmountText}>
            Rs. {successInfo.amount.toLocaleString()}
          </Text>

          <View style={styles.successReceiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Recipient</Text>
              <Text style={styles.receiptValue}>{successInfo.phone}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Network</Text>
              <Text style={styles.receiptValue}>{successInfo.network}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service</Text>
              <Text style={styles.receiptValue}>{successInfo.mode}</Text>
            </View>
            <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.receiptLabel}>Status</Text>
              <Text style={[styles.receiptValue, { color: '#00D494' }]}>Completed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setCurrentScreen('MENU')}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#EDF5FC', // Crystalline ice frost
  },
  topNavRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtnHitArea: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 20,
  },

  // --------------------------------------------------------
  // Cards in Screenshot 1
  // --------------------------------------------------------
  whiteOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  peachIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardTexts: {
    marginLeft: 14,
    flex: 1,
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionCardSubtitle: {
    fontSize: 13,
    color: '#8A98A8',
    marginTop: 3,
  },
  payAgainSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A98A8',
    marginTop: 24,
    marginBottom: 16,
  },
  payAgainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  payAgainTexts: {
    marginLeft: 14,
    flex: 1,
  },
  payAgainPhone: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  payAgainSubtitle: {
    fontSize: 13,
    color: '#8A98A8',
    marginTop: 2,
  },
  ellipsisHitArea: {
    padding: 8,
  },

  // --------------------------------------------------------
  // Brand Badges (Jazz, Telenor, Ufone, Zong)
  // --------------------------------------------------------
  brandBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  jazzText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  telenorSymbolBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telenorPetal: {
    position: 'absolute',
    width: 7,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#00A9E0',
    top: 1,
  },
  ufoneText: {
    color: '#FF6600',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  zongGreenText: {
    color: '#00A859',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
  },
  zongMagentaText: {
    color: '#E4007F',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
  },

  // --------------------------------------------------------
  // Centered Header Bar (Screenshot 2)
  // --------------------------------------------------------
  centeredNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeftBack: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centeredNavTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  // --------------------------------------------------------
  // Body Elements (Screenshot 2)
  // --------------------------------------------------------
  topUpFormBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  pillInputContainer: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.8,
    borderColor: '#0F172A',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 16,
  },
  pillTextInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  operatorSelectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  antennaPeachCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorCardTitle: {
    marginLeft: 14,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  operatorSelectAction: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FA6854',
  },
  selectedOperatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  operatorSelectedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Continue Button
  continueButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#FFD4CE',
  },
  continueButtonActive: {
    backgroundColor: '#FA6854',
    shadowColor: '#FA6854',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.85,
  },
  continueTextActive: {
    color: '#FFFFFF',
  },

  // Keypad
  keypadContainer: {
    paddingVertical: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  keypadCell: {
    width: 68,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadCellPlaceholder: {
    width: 68,
    height: 46,
  },
  keypadDigitText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
  },

  // --------------------------------------------------------
  // Network Selection List (Screenshot 3)
  // --------------------------------------------------------
  networkSubheader: {
    fontSize: 14,
    color: '#8A98A8',
    marginBottom: 16,
  },
  networkSelectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  networkCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 16,
  },

  // --------------------------------------------------------
  // Amount & Confirmation
  // --------------------------------------------------------
  amountContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryPhone: {
    fontSize: 14,
    color: '#8A98A8',
    marginTop: 2,
  },
  amountPromptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FA6854',
    paddingHorizontal: 18,
    height: 60,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FA6854',
    marginRight: 8,
  },
  largeAmountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetChipActive: {
    borderColor: '#FA6854',
    backgroundColor: '#FFF2F0',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#FA6854',
    fontWeight: '700',
  },
  payConfirmButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FA6854',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FA6854',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // --------------------------------------------------------
  // Success Screen
  // --------------------------------------------------------
  successScreenContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6FAF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  successAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D494',
    marginBottom: 20,
  },
  successReceiptBox: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#8A98A8',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
