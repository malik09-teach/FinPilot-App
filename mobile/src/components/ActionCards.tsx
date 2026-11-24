import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowDown, ArrowUpRight } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ActionCardsProps {
  onLoadMoney: () => void;
  onSendRequest: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({ onLoadMoney, onSendRequest }) => {
  return (
    <View style={styles.columnContainer}>
      {/* Top: Load Money Card (Blue) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onLoadMoney}
        style={[styles.card, { backgroundColor: 'rgba(0, 132, 255, 0.92)' }]}
      >
        <View style={styles.iconTopLeft}>
          <ArrowDown size={24} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={styles.cardTitle}>Load{'\n'}Money</Text>
        <View style={styles.iceGlintSheen} />
      </TouchableOpacity>

      {/* Bottom: Send & Request Card (Coral) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onSendRequest}
        style={[styles.card, { backgroundColor: 'rgba(250, 104, 84, 0.92)' }]}
      >
        <View style={styles.iconTopRight}>
          <ArrowUpRight size={24} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={styles.cardTitle}>Send &{'\n'}Request</Text>
        <View style={styles.iceGlintSheen} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    flex: 0.95,
    gap: 12,
  },
  card: {
    flex: 1,
    minHeight: 104,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  iceGlintSheen: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    pointerEvents: 'none',
  },
  iconTopLeft: {
    alignSelf: 'flex-start',
  },
  iconTopRight: {
    alignSelf: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
});
