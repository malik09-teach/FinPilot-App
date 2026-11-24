import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore } from '../store/bank-store';

interface BalanceCardProps {
  onPress?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ onPress }) => {
  const { balance, isBalanceHidden, toggleBalanceHidden } = useBankStore();

  const formattedAmount = isBalanceHidden
    ? '••••••'
    : `${balance.currency} ${balance.amount.toLocaleString()}`;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.container}
    >
      {/* Top row: Label and Eye Toggle */}
      <View style={styles.topRow}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <TouchableOpacity
          onPress={toggleBalanceHidden}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.eyeButton}
        >
          {isBalanceHidden ? (
            <EyeOff size={18} color="rgba(255, 255, 255, 0.85)" />
          ) : (
            <Eye size={18} color="rgba(255, 255, 255, 0.85)" />
          )}
        </TouchableOpacity>
      </View>

      {/* Balance Amount */}
      <Text style={styles.balanceText} numberOfLines={1} adjustsFontSizeToFit>
        {formattedAmount}
      </Text>

      {/* Bottom row: Mastercard Circles and Right Arrow */}
      <View style={styles.bottomRow}>
        {/* Mastercard Logo (Red and Orange overlapping circles) */}
        <View style={styles.mastercardContainer}>
          <View style={[styles.cardCircle, { backgroundColor: '#EB001B', zIndex: 1 }]} />
          <View style={[styles.cardCircle, { backgroundColor: '#F79E1B', marginLeft: -10, opacity: 0.95 }]} />
        </View>

        {/* Navigation Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </View>

      {/* Crystal Ice Glint Accent */}
      <View style={styles.iceGlintSheen} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1.15,
    backgroundColor: 'rgba(0, 212, 148, 0.92)', // Translucent glowing teal ice
    borderRadius: 26,
    padding: 20,
    minHeight: 220,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#00D494',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  iceGlintSheen: {
    position: 'absolute',
    top: -35,
    right: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    pointerEvents: 'none',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.2,
  },
  eyeButton: {
    padding: 2,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: -8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
