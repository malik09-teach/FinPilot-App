import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Sparkles, AlertCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface BudgetsModalProps {
  visible: boolean;
  onClose: () => void;
  onAskAi?: () => void;
}

export const BudgetsModal: React.FC<BudgetsModalProps> = ({ visible, onClose }) => {
  const budget = {
    totalLimit: 120000,
    totalSpent: 44700,
    categories: [
      { category: 'FOOD', allocated: 40000, spent: 16500 },
      { category: 'BILLS', allocated: 30000, spent: 18200 },
      { category: 'UTILITIES', allocated: 25000, spent: 8500 },
      { category: 'ENTERTAINMENT', allocated: 15000, spent: 1500 },
      { category: 'SHOPPING', allocated: 10000, spent: 0 },
    ],
  };

  const spentPercentage = Math.round((budget.totalSpent / budget.totalLimit) * 100);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Management</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Main Limit Meter */}
          <View style={styles.card}>
            <Text style={styles.monthLabel}>November 2026 Budget</Text>
            <Text style={styles.spentAmount}>
              Rs. {budget.totalSpent.toLocaleString()}{' '}
              <Text style={styles.totalLimit}>/ Rs. {budget.totalLimit.toLocaleString()}</Text>
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${spentPercentage}%` }]} />
            </View>
            <Text style={styles.spentPercentText}>{spentPercentage}% utilized • Rs. {(budget.totalLimit - budget.totalSpent).toLocaleString()} remaining</Text>
          </View>

          {/* Categories */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Category Allowances</Text>
            {budget.categories.map((c, i) => {
              const pct = Math.round((c.spent / c.allocated) * 100);
              return (
                <View key={i} style={styles.catItem}>
                  <View style={styles.catTop}>
                    <Text style={styles.catName}>{c.category}</Text>
                    <Text style={styles.catNumbers}>
                      Rs. {c.spent.toLocaleString()} / {c.allocated.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.catProgress}>
                    <View
                      style={[
                        styles.catProgressFill,
                        {
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: pct > 80 ? colors.coralAccent : colors.tealPrimary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  spentAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 12,
  },
  totalLimit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.tealPrimary,
    borderRadius: 5,
  },
  spentPercentText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2F7EE',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.tealPrimary,
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
    color: '#047857',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 14,
  },
  catItem: {
    marginBottom: 14,
    gap: 6,
  },
  catTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  catNumbers: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  catProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
