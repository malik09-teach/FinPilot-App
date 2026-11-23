import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBankStore, TransactionItem } from '../store/bank-store';

interface AllTransactionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTransaction: (tx: TransactionItem) => void;
}

export const AllTransactionsModal: React.FC<AllTransactionsModalProps> = ({
  visible,
  onClose,
  onSelectTransaction,
}) => {
  const { recentTransactions } = useBankStore();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['ALL', 'TRANSFER', 'FOOD', 'BILLS', 'UTILITIES', 'ENTERTAINMENT', 'SALARY'];

  const filtered = recentTransactions.filter((tx) => {
    const matchesCat =
      selectedCategory === 'ALL' || tx.category?.toUpperCase() === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.counterpartyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Transactions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by merchant, note, or reference..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No matching transactions found</Text>
          ) : (
            filtered.map((tx) => {
              const isDebit = tx.type === 'DEBIT';
              const name = (tx.counterpartyName || tx.description).toUpperCase();

              return (
                <TouchableOpacity
                  key={tx.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    onSelectTransaction(tx);
                  }}
                  style={styles.txRow}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDebit ? colors.coralLight : '#E2F7EE' },
                    ]}
                  >
                    {isDebit ? (
                      <ArrowUpRight size={20} color={colors.coralAccent} strokeWidth={2.4} />
                    ) : (
                      <ArrowDownLeft size={20} color={colors.tealPrimary} strokeWidth={2.4} />
                    )}
                  </View>

                  <View style={styles.txDetails}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.category} • {new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={styles.txAmount}>
                    {isDebit ? 'Rs. ' : '+Rs. '}
                    {tx.amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
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
  headerTitle: {
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: colors.coralAccent,
    borderColor: colors.coralAccent,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 2,
  },
  txMeta: {
    fontSize: 12,
    color: '#8E9BAE',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 40,
    fontSize: 14,
  },
});
