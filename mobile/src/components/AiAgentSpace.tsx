import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Send,
  BarChart2,
  Bitcoin,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

interface AiAgentSpaceProps {
  onOpenAiWorkspace: (initialPrompt?: string) => void;
}

const QUICK_ACTIONS = [
  {
    icon: <TrendingUp size={13} color={colors.tealPrimary} />,
    label: 'Save 100K in 4mo',
    prompt: 'I want to save PKR 100,000 in four months.',
    color: 'rgba(0,212,148,0.1)',
    border: 'rgba(0,212,148,0.25)',
  },
  {
    icon: <Bitcoin size={13} color="#F7931A" />,
    label: 'BTC & Gold',
    prompt: 'Show me BTC, Gold, Crude Oil and Silver prices. My budget is PKR 50,000.',
    color: 'rgba(247,147,26,0.1)',
    border: 'rgba(247,147,26,0.25)',
  },
  {
    icon: <Send size={13} color={colors.coralAccent} />,
    label: 'Send 5K to Ali',
    prompt: 'Send PKR 5,000 to Ali',
    color: 'rgba(250,104,84,0.1)',
    border: 'rgba(250,104,84,0.25)',
  },
  {
    icon: <ShieldCheck size={13} color={colors.blueSecondary} />,
    label: 'Fraud Check',
    prompt: 'Check for fraud and unusual transactions',
    color: 'rgba(0,132,255,0.1)',
    border: 'rgba(0,132,255,0.25)',
  },
];

export const AiAgentSpace: React.FC<AiAgentSpaceProps> = ({ onOpenAiWorkspace }) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Sparkles size={15} color={colors.tealPrimary} />
          <Text style={styles.badgeText}>AI Copilot</Text>
        </View>
        <TouchableOpacity onPress={() => onOpenAiWorkspace()} style={styles.openBtn} activeOpacity={0.7}>
          <Text style={styles.openText}>Open</Text>
          <ArrowRight size={13} color={colors.tealPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onOpenAiWorkspace()}
        style={styles.card}
      >
        {/* Decorative gradient blob */}
        <View style={styles.blob} />

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <View style={styles.iconGlow} />
            <View style={styles.iconBox}>
              <Sparkles size={18} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.cardTitle}>Autonomous Financial Copilot</Text>
            <Text style={styles.cardSub}>
              Budgets · Savings · Investments · Transfers · Fraud Detection
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Quick Action Chips */}
        <View style={styles.chipsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.chip, { backgroundColor: action.color, borderColor: action.border }]}
              onPress={() => onOpenAiWorkspace(action.prompt)}
              activeOpacity={0.75}
            >
              {action.icon}
              <Text style={styles.chipText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,212,148,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,148,0.2)',
  },
  openText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tealPrimary,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,212,148,0.15)',
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  blob: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0,212,148,0.07)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tealPrimary,
    opacity: 0.15,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  textBox: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(226,232,240,0.6)',
    marginBottom: 14,
  },

  /* Chips */
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
});
