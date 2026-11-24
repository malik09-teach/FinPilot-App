import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Snowflake,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';

interface MyCardsScreenProps {
  onBack: () => void;
}

export const MyCardsScreen: React.FC<MyCardsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { card, toggleCardFreeze, user } = useBankStore();

  const [activeTab, setActiveTab] = useState<'virtual' | 'physical'>('virtual');
  const [showDetails, setShowDetails] = useState(false);

  const isFrozen = card?.isFrozen ?? false;

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16
  ) + 8;

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
        <View style={[styles.card, isFrozen && styles.cardFrozen]}>
          {/* Subtle Watermark Monogram Background Logo */}
          <View style={styles.watermark}>
            <Svg width={180} height={180} viewBox="0 0 100 100">
              <Path
                d="M30,20 C15,20 10,35 10,50 C10,65 20,80 35,80 C50,80 55,65 55,50 C55,35 65,20 80,20 C95,20 90,40 90,50 C90,65 80,80 65,80"
                fill="none"
                stroke="#64748B"
                strokeWidth="12"
                strokeLinecap="round"
                opacity={0.12}
              />
            </Svg>
          </View>

          {/* Card Top Label */}
          <View style={styles.cardTop}>
            <Text style={styles.cardTypeLabel}>
              {activeTab === 'virtual' ? 'Virtual card' : 'Physical card'}
            </Text>
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Snowflake size={11} color="#3B82F6" />
                <Text style={styles.frozenBadgeText}>FROZEN</Text>
              </View>
            )}
          </View>

          {/* Sensitive Card Info (Revealed on Eye tap) */}
          {showDetails && (
            <View style={styles.cardDetailsBox}>
              <Text style={styles.cardNumber}>5412 •••• •••• 8824</Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMetaText}>EXP: 08/29</Text>
                <Text style={styles.cardMetaText}>CVV: 742</Text>
              </View>
            </View>
          )}

          {/* Card Holder Name */}
          <View style={styles.cardNameSection}>
            <Text style={styles.cardHolderName}>Sayyed Taimoor Shah</Text>
          </View>

          {/* Card Bottom Row: Eye Button and Mastercard Badge */}
          <View style={styles.cardBottomRow}>
            {/* Eye Toggle Pill Button */}
            <TouchableOpacity
              onPress={() => setShowDetails((prev) => !prev)}
              style={styles.eyePillButton}
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
    marginBottom: 26,
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
    width: 255,
    height: 375,
    backgroundColor: '#EDF4F3', // Soft icy mint/white tint matching screenshot
    borderRadius: 26,
    padding: 22,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFrozen: {
    opacity: 0.72,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 1.5,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardNameSection: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  cardHolderName: {
    fontSize: 18,
    fontWeight: '700',
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
    marginTop: 34,
    paddingHorizontal: 22,
    gap: 24,
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
});
