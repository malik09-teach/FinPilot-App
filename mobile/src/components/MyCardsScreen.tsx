import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Snowflake,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';

interface MyCardsScreenProps {
  onBack: () => void;
}

const CARDS_DATA = {
  virtual: {
    type: 'Virtual card',
    number: '2621 0882 3080 2449',
    maskedNumber: '2621 •••• •••• 2449',
    cvv: '165',
    validThru: '08/30',
    holderName: 'SHAH G',
    bgColor: '#EDF4F3', // Soft icy mint from screenshot
    textColor: '#475569',
    watermarkColor: '#64748B',
  },
  physical: {
    type: 'Physical card',
    number: '2307 7954 2860 1307',
    maskedNumber: '2307 •••• •••• 1307',
    cvv: '496',
    validThru: '02/31',
    holderName: 'MALIK',
    bgColor: '#1E293B', // Sleek midnight for physical card
    textColor: '#F8FAFC',
    watermarkColor: '#94A3B8',
  },
};

export const MyCardsScreen: React.FC<MyCardsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { card, toggleCardFreeze } = useBankStore();

  const [activeTab, setActiveTab] = useState<'virtual' | 'physical'>('virtual');
  const [showDetails, setShowDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isFrozen = card?.isFrozen ?? false;
  const currentCard = CARDS_DATA[activeTab];
  const isPhysical = activeTab === 'physical';

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16
  ) + 8;

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1800);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ChevronLeft size={26} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My cards</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Segmented Pills Tab Switcher (Virtual / Physical) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'virtual' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('virtual')}
          activeOpacity={0.8}
        >
          <View style={styles.dotIndicator} />
          <Text
            style={[
              styles.tabText,
              activeTab === 'virtual' && styles.tabTextActive,
            ]}
          >
            Virtual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'physical' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('physical')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'physical' && styles.tabTextActive,
            ]}
          >
            Physical
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Display Area */}
      <View style={styles.cardArea}>
        <View
          style={[
            styles.card,
            { backgroundColor: currentCard.bgColor },
            isFrozen && styles.cardFrozen,
          ]}
        >
          {/* Subtle Watermark Monogram Background Logo */}
          <View style={styles.watermark}>
            <Svg width={180} height={180} viewBox="0 0 100 100">
              <Path
                d="M30,20 C15,20 10,35 10,50 C10,65 20,80 35,80 C50,80 55,65 55,50 C55,35 65,20 80,20 C95,20 90,40 90,50 C90,65 80,80 65,80"
                fill="none"
                stroke={currentCard.watermarkColor}
                strokeWidth="12"
                strokeLinecap="round"
                opacity={0.12}
              />
            </Svg>
          </View>

          {/* Card Top Label */}
          <View style={styles.cardTop}>
            <Text
              style={[
                styles.cardTypeLabel,
                isPhysical && { color: '#94A3B8' },
              ]}
            >
              {currentCard.type}
            </Text>
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Snowflake size={11} color="#3B82F6" />
                <Text style={styles.frozenBadgeText}>FROZEN</Text>
              </View>
            )}
          </View>

          {/* Card Number & Sensitive Details (Revealed only when eye is clicked) */}
          {showDetails && (
            <View
              style={[
                styles.cardDetailsBox,
                isPhysical && styles.cardDetailsBoxDark,
              ]}
            >
              <Text
                style={[
                  styles.cardNumber,
                  isPhysical && { color: '#FFFFFF' },
                ]}
              >
                {currentCard.number}
              </Text>
              <View style={styles.cardMetaRow}>
                <Text
                  style={[
                    styles.cardMetaText,
                    isPhysical && { color: '#CBD5E1' },
                  ]}
                >
                  Valid Thru: {currentCard.validThru}
                </Text>
                <Text
                  style={[
                    styles.cardMetaText,
                    isPhysical && { color: '#CBD5E1' },
                  ]}
                >
                  CVV: {currentCard.cvv}
                </Text>
              </View>
            </View>
          )}

          {/* Card Holder Name */}
          <View style={styles.cardNameSection}>
            <Text
              style={[
                styles.cardHolderName,
                isPhysical && { color: '#F8FAFC' },
              ]}
            >
              {currentCard.holderName}
            </Text>
          </View>

          {/* Card Bottom Row: Eye Button and Mastercard Badge */}
          <View style={styles.cardBottomRow}>
            {/* Eye Toggle Pill Button */}
            <TouchableOpacity
              onPress={() => setShowDetails((prev) => !prev)}
              style={[
                styles.eyePillButton,
                isPhysical && { backgroundColor: '#334155' },
              ]}
              activeOpacity={0.8}
            >
              {showDetails ? (
                <EyeOff size={18} color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <Eye size={18} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            {/* Mastercard Overlapping Red & Orange Circles */}
            <View style={styles.mastercardContainer}>
              <View
                style={[
                  styles.mastercardCircle,
                  { backgroundColor: '#EB001B', zIndex: 1 },
                ]}
              />
              <View
                style={[
                  styles.mastercardCircle,
                  { backgroundColor: '#F79E1B', marginLeft: -12, opacity: 0.95 },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Options Section Below Card */}
      <View style={styles.optionsSection}>
        {/* 1. Freeze Card Option */}
        <View style={styles.optionItem}>
          <View style={styles.optionIconContainer}>
            <Snowflake size={23} color="#FA6854" strokeWidth={2.2} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Freeze card</Text>
            <Text style={styles.optionSubtitle}>Lock this card temporarily</Text>
          </View>
          <Switch
            value={isFrozen}
            onValueChange={toggleCardFreeze}
            trackColor={{ false: '#E2E8F0', true: '#FA6854' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
          />
        </View>

        {/* 2. Quick Card Info Summary Card (Only when showDetails is active) */}
        {showDetails && (
          <View style={styles.infoSummaryCard}>
            <View style={styles.infoSummaryRow}>
              <View>
                <Text style={styles.infoSummaryLabel}>Card Number</Text>
                <Text style={styles.infoSummaryValue}>{currentCard.number}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => handleCopy(currentCard.number.replace(/\s/g, ''), 'number')}
              >
                {copiedField === 'number' ? (
                  <Check size={16} color="#00D494" />
                ) : (
                  <Copy size={16} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoSummaryDivider} />

            <View style={styles.infoSummaryBottomRow}>
              <View>
                <Text style={styles.infoSummaryLabel}>Valid Thru</Text>
                <Text style={styles.infoSummaryValue}>{currentCard.validThru}</Text>
              </View>
              <View>
                <Text style={styles.infoSummaryLabel}>CVV</Text>
                <Text style={styles.infoSummaryValue}>{currentCard.cvv}</Text>
              </View>
              <View>
                <Text style={styles.infoSummaryLabel}>Cardholder</Text>
                <Text style={styles.infoSummaryValue}>{currentCard.holderName}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 36,
  },

  // Segmented Pill Switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    height: 44,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FA6854', // Coral dot from screenshot
    marginRight: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E9BAE',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Card Area
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: 260,
    height: 380,
    backgroundColor: '#EDF4F3',
    borderRadius: 26,
    padding: 22,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardFrozen: {
    opacity: 0.72,
    backgroundColor: '#CBD5E1',
  },
  watermark: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#8E9BAE',
  },
  frozenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  frozenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardDetailsBoxDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1.2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardMetaText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '700',
  },
  cardNameSection: {
    marginTop: 'auto',
    marginBottom: 16,
  },
  cardHolderName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: -0.2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyePillButton: {
    width: 54,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5D6D7E', // Slate pill background from screenshot
    justifyContent: 'center',
    alignItems: 'center',
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  // Options Section
  optionsSection: {
    marginTop: 24,
    paddingHorizontal: 22,
    gap: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 36,
    alignItems: 'flex-start',
    marginRight: 10,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  optionSubtitle: {
    fontSize: 13.5,
    color: '#8E9BAE',
    marginTop: 2,
  },

  // Info Summary Card Below
  infoSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  infoSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSummaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  infoSummaryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoSummaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  copyIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
