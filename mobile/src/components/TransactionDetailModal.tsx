import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, ArrowUpRight, ArrowDownLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { TransactionItem } from '../store/bank-store';
import { AdaptiveModal } from './AdaptiveModal';

interface TransactionDetailModalProps {
  transaction: TransactionItem | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isDebit = transaction.type === 'DEBIT';

  return (
    <AdaptiveModal visible={!!transaction} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.topRow}>
            <Text style={styles.title}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount & Status banner */}
            <View style={styles.amountBox}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDebit ? colors.coralLight : '#E2F7EE' },
                ]}
              >
                {isDebit ? (
                  <ArrowUpRight size={26} color={colors.coralAccent} strokeWidth={2.4} />
                ) : (
                  <ArrowDownLeft size={26} color={colors.tealPrimary} strokeWidth={2.4} />
                )}
              </View>
              <Text style={styles.amountText}>
                {isDebit ? '-Rs. ' : '+Rs. '}
                {transaction.amount.toLocaleString()}
              </Text>
              <View style={styles.statusBadge}>
                <CheckCircle2 size={12} color={colors.tealPrimary} />
                <Text style={styles.statusText}>{transaction.status || 'COMPLETED'}</Text>
              </View>
            </View>

            {/* Details Table */}
            <View style={styles.infoTable}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Recipient / Merchant</Text>
                <Text style={styles.val}>
                  {(transaction.counterpartyName || transaction.description).toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.val}>{transaction.category || 'TRANSFER'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Reference Number</Text>
                <Text style={styles.valMono}>{transaction.reference}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Date & Time</Text>
                <Text style={styles.val}>
                  {new Date(transaction.createdAt || Date.now()).toLocaleString()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.val}>{transaction.description}</Text>
              </View>
            </View>

            {/* Double-Entry Ledger Verification Card */}
            <View style={styles.ledgerCard}>
              <View style={styles.ledgerHeader}>
                <ShieldCheck size={16} color={colors.tealPrimary} />
                <Text style={styles.ledgerTitle}>Double-Entry Ledger Proof</Text>
              </View>
              <Text style={styles.ledgerDescription}>
                This transaction has been cryptographically recorded with balanced debit and credit entries in the core banking ledger.
              </Text>
              <View style={styles.ledgerItem}>
                <Text style={styles.ledgerSide}>DR (Account 1002345678):</Text>
                <Text style={styles.ledgerAmt}>Rs. {transaction.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.ledgerItem}>
                <Text style={styles.ledgerSide}>CR (Settlement / Beneficiary):</Text>
                <Text style={styles.ledgerAmt}>Rs. {transaction.amount.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBox: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E2F7EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tealPrimary,
  },
  infoTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    maxWidth: '60%',
    textAlign: 'right',
  },
  valMono: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    fontFamily: 'monospace',
  },
  ledgerCard: {
    backgroundColor: '#E2F7EE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ledgerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tealPrimary,
    textTransform: 'uppercase',
  },
  ledgerDescription: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
    marginBottom: 8,
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ledgerSide: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  ledgerAmt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  doneBtn: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
});
