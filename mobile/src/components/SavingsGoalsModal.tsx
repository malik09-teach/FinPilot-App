import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Target, Plus, CheckCircle2, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface SavingsGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onAskAi?: (prompt: string) => void;
}

export const SavingsGoalsModal: React.FC<SavingsGoalsModalProps> = ({
  visible,
  onClose,
}) => {
  const [goals, setGoals] = useState([
    {
      id: 'g1',
      name: 'Emergency Fund',
      target: 300000,
      current: 120000,
      deadline: 'March 2027',
    },
    {
      id: 'g2',
      name: 'M2 MacBook Pro Upgrade',
      target: 180000,
      current: 65000,
      deadline: 'January 2027',
    },
  ]);

  const handleDeposit = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: g.current + amount } : g))
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings Goals</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Goal Cards */}
          {goals.map((g) => {
            const pct = Math.round((g.current / g.target) * 100);
            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalIconCircle}>
                    <Target size={20} color={colors.coralAccent} />
                  </View>
                  <View style={styles.goalMeta}>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <Text style={styles.goalDeadline}>Target: {g.deadline}</Text>
                  </View>
                  <Text style={styles.goalPct}>{pct}%</Text>
                </View>

                <Text style={styles.goalAmounts}>
                  Rs. {g.current.toLocaleString()}{' '}
                  <Text style={styles.goalTarget}>/ Rs. {g.target.toLocaleString()}</Text>
                </Text>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%` }]} />
                </View>

                {/* Deposit shortcut */}
                <TouchableOpacity
                  onPress={() => handleDeposit(g.id, 5000)}
                  style={styles.depositBtn}
                >
                  <Plus size={14} color={colors.tealPrimary} />
                  <Text style={styles.depositBtnText}>Quick Deposit +Rs. 5,000</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
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
  title: {
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
  content: {
    padding: 20,
    gap: 16,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBE8',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.coralAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  aiSubtitle: {
    fontSize: 12,
    color: colors.coralAccent,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalMeta: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#64748B',
  },
  goalPct: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.coralAccent,
  },
  goalAmounts: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 10,
  },
  goalTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.coralAccent,
    borderRadius: 5,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E2F7EE',
    borderRadius: 14,
    paddingVertical: 10,
  },
  depositBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.tealPrimary,
  },
});
