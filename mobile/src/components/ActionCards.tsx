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
        style={[styles.card, { backgroundColor: colors.blueSecondary }]}
      >
        <View style={styles.iconTopLeft}>
          <ArrowDown size={24} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={styles.cardTitle}>Load{'\n'}Money</Text>
      </TouchableOpacity>

      {/* Bottom: Send & Request Card (Coral) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onSendRequest}
        style={[styles.card, { backgroundColor: colors.coralAccent }]}
      >
        <View style={styles.iconTopRight}>
          <ArrowUpRight size={24} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <Text style={styles.cardTitle}>Send &{'\n'}Request</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
