import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, Send } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface AiAgentSpaceProps {
  onOpenAiWorkspace: (initialPrompt?: string) => void;
}

export const AiAgentSpace: React.FC<AiAgentSpaceProps> = ({ onOpenAiWorkspace }) => {
  return (
    <View style={styles.container}>
      {/* Clean reserved space header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Sparkles size={16} color={colors.tealPrimary} />
          <Text style={styles.badgeText}>FinPilot Agentic AI Space</Text>
        </View>
        <TouchableOpacity onPress={() => onOpenAiWorkspace()} style={styles.openButton}>
          <Text style={styles.openText}>Open Copilot</Text>
          <ArrowRight size={14} color={colors.tealPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Agent Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onOpenAiWorkspace()}
        style={styles.copilotCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sparkleIconBox}>
            <Sparkles size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.agentTitle}>Autonomous Financial Copilot</Text>
            <Text style={styles.agentSubtitle}>
              Multi-agent coordination for budgets, savings, and smart transfers.
            </Text>
          </View>
        </View>

        {/* Quick Action Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => onOpenAiWorkspace('I want to save PKR 100,000 in four months.')}
          >
            <TrendingUp size={13} color={colors.tealPrimary} />
            <Text style={styles.chipText}>Save 100K in 4 mo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => onOpenAiWorkspace('Send PKR 5,000 to Ali')}
          >
            <Send size={13} color={colors.coralAccent} />
            <Text style={styles.chipText}>Send 5K to Ali</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chip}
            onPress={() => onOpenAiWorkspace('Check for fraud and unusual transactions')}
          >
            <ShieldCheck size={13} color={colors.blueSecondary} />
            <Text style={styles.chipText}>Fraud Check</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.tealPrimary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tealPrimary,
  },
  copilotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2F7EE',
    shadowColor: '#00D494',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  sparkleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  agentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 2,
  },
  agentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
});
