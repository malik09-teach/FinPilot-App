import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, TrendingUp, TrendingDown, PieChart } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';

interface AnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ visible, onClose }) => {
  const [data, setData] = useState({
    totalIncome: 250000,
    totalExpense: 44700,
    netSavings: 205300,
    savingsRate: 82,
    categories: [
      { category: 'FOOD', amount: 16500, percentage: 37 },
      { category: 'BILLS', amount: 18200, percentage: 41 },
      { category: 'UTILITIES', amount: 8500, percentage: 19 },
      { category: 'ENTERTAINMENT', amount: 1500, percentage: 3 },
    ],
  });

  useEffect(() => {
    if (visible) {
      api.getAnalytics().then(setData).catch(console.warn);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Analytics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Income vs Expense Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#E2F7EE' }]}>
              <View style={styles.summaryIcon}>
                <TrendingUp size={20} color={colors.tealPrimary} />
              </View>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryVal, { color: colors.tealPrimary }]}>
                Rs. {data.totalIncome.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#FFEBE8' }]}>
              <View style={styles.summaryIcon}>
                <TrendingDown size={20} color={colors.coralAccent} />
              </View>
              <Text style={styles.summaryLabel}>Total Outflow</Text>
              <Text style={[styles.summaryVal, { color: colors.coralAccent }]}>
                Rs. {data.totalExpense.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Savings Rate Card */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsInfo}>
              <Text style={styles.savingsLabel}>Net Monthly Savings</Text>
              <Text style={styles.savingsAmt}>Rs. {data.netSavings.toLocaleString()}</Text>
            </View>
            <View style={styles.rateBadge}>
              <Text style={styles.rateText}>{data.savingsRate}% Saved</Text>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.categoriesBox}>
            <Text style={styles.catHeading}>Spending by Category</Text>
            {data.categories.map((c, i) => (
              <View key={i} style={styles.catRow}>
                <View style={styles.catTop}>
                  <Text style={styles.catName}>{c.category}</Text>
                  <Text style={styles.catAmount}>
                    Rs. {c.amount.toLocaleString()} ({c.percentage}%)
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, c.percentage)}%`,
                        backgroundColor: i === 0 ? colors.coralAccent : i === 1 ? colors.blueSecondary : colors.tealPrimary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savingsInfo: {
    gap: 4,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  savingsAmt: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
  },
  rateBadge: {
    backgroundColor: '#E2F7EE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.tealPrimary,
  },
  categoriesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  catHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  catRow: {
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
  catAmount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
