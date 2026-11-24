import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { TransactionItem } from '../store/bank-store';

interface TransactionsSectionProps {
  transactions: TransactionItem[];
  onSeeAll: () => void;
  onSelectTransaction?: (tx: TransactionItem) => void;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  transactions,
  onSeeAll,
  onSelectTransaction,
}) => {
  const displayItems = transactions.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        {displayItems.length === 0 ? (
          <Text style={styles.emptyText}>No recent transactions</Text>
        ) : (
          displayItems.map((tx, index) => {
            const timeString = formatTransactionTime(tx.createdAt);
            const isDebit = tx.type === 'DEBIT';
            const counterparty = tx.counterpartyName || tx.description;

            return (
              <TouchableOpacity
                key={tx.id || index}
                activeOpacity={0.7}
                onPress={() => onSelectTransaction?.(tx)}
                style={styles.itemRow}
              >
                {/* Soft coral rounded icon with up-right diagonal arrow */}
                <View style={styles.iconContainer}>
                  <ArrowUpRight size={22} color={colors.coralAccent} strokeWidth={2.4} />
                </View>

                {/* Details */}
                <View style={styles.detailsCol}>
                  <Text style={styles.counterpartyName} numberOfLines={1}>
                    {counterparty.toUpperCase()}
                  </Text>
                  <Text style={styles.timeText}>{timeString}</Text>
                </View>

                {/* Amount */}
                <Text style={styles.amountText}>
                  {isDebit ? 'Rs. ' : '+Rs. '}
                  {tx.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

function formatTransactionTime(dateStr?: string) {
  if (!dateStr) return '6:23 PM';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '6:23 PM';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FA6854',
  },
  listContainer: {
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 235, 232, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  counterpartyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  timeText: {
    fontSize: 13,
    color: '#8E9BAE',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
  },
});
