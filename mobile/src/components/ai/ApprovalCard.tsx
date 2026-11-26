import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { AiActionCardData } from '../../store/ai-store';

interface ApprovalCardProps {
  action: AiActionCardData;
  onApprove: (action: AiActionCardData) => void;
  onReject: (action: AiActionCardData) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  action,
  onApprove,
  onReject,
}) => {
  const isBusy = action.uiStatus === 'verifying';
  const isFinal =
    action.uiStatus === 'completed' || action.uiStatus === 'rejected';

  const statusLabel =
    action.uiStatus === 'awaiting'
      ? action.requiresPin
        ? 'AWAITING PIN'
        : 'AWAITING APPROVAL'
      : action.uiStatus.toUpperCase();

  return (
    <View style={styles.card} accessible accessibilityLabel={`Action proposal: ${action.summary}`}>
      <View style={styles.header}>
        <ShieldCheck size={17} color={colors.tealPrimary} />
        <Text style={styles.typeText}>{action.actionType.replace(/_/g, ' ')}</Text>
        <View
          style={[
            styles.badge,
            action.uiStatus === 'completed' && styles.badgeDone,
            action.uiStatus === 'failed' && styles.badgeErr,
            action.uiStatus === 'rejected' && styles.badgeMuted,
          ]}
        >
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{action.summary}</Text>

      {action.amount !== undefined ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Amount</Text>
          <Text style={styles.metaValue}>PKR {action.amount.toLocaleString()}</Text>
        </View>
      ) : null}
      {action.recipientName ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Recipient</Text>
          <Text style={styles.metaValue}>
            {action.recipientName}
            {action.recipientAccount ? ` (${action.recipientAccount})` : ''}
          </Text>
        </View>
      ) : null}
      {action.fee !== undefined ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Fee</Text>
          <Text style={styles.metaValue}>PKR {action.fee.toLocaleString()}</Text>
        </View>
      ) : null}
      {action.expiresAt ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Expires</Text>
          <Text style={styles.metaValue}>
            {new Date(action.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      ) : null}

      {action.errorMessage ? (
        <View style={styles.errorRow}>
          <AlertTriangle size={14} color={colors.danger} />
          <Text style={styles.errorText}>{action.errorMessage}</Text>
        </View>
      ) : null}

      {action.uiStatus === 'completed' ? (
        <View style={styles.statusBanner}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={styles.statusDoneText}>Approved and executed</Text>
        </View>
      ) : action.uiStatus === 'rejected' ? (
        <View style={styles.statusBanner}>
          <XCircle size={16} color={colors.textSecondary} />
          <Text style={styles.statusMutedText}>Declined by you</Text>
        </View>
      ) : !isFinal ? (
        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={() => onReject(action)}
            disabled={isBusy}
            style={[styles.declineBtn, isBusy && styles.btnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Decline action"
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onApprove(action)}
            disabled={isBusy}
            style={[styles.approveBtn, isBusy && styles.btnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={action.requiresPin ? 'Approve with PIN' : 'Approve action'}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                {action.requiresPin ? <Lock size={14} color="#FFFFFF" /> : null}
                <Text style={styles.approveText}>
                  {action.requiresPin ? 'Approve with PIN' : 'Approve'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: colors.coralLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDone: {
    backgroundColor: '#D1FAE5',
  },
  badgeErr: {
    backgroundColor: '#FEE2E2',
  },
  badgeMuted: {
    backgroundColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDark,
  },
  summary: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  statusMutedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.tealPrimary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  approveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});
