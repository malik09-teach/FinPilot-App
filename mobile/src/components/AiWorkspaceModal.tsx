import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Sparkles, Send, X, Square, RotateCcw, Bot, Zap } from 'lucide-react-native';
import { AdaptiveModal } from './AdaptiveModal';
import { PinScreen } from './PinScreen';
import { ChatMessageBubble } from './ai/ChatMessageBubble';
import { ToolActivityChip } from './ai/ToolActivityChip';
import { ApprovalCard } from './ai/ApprovalCard';
import { SuggestedPrompts } from './ai/SuggestedPrompts';
import { useAiChat } from '../hooks/useAiChat';
import { AI_PIN_LENGTH, AiActionCardData } from '../store/ai-store';
import { colors } from '../theme/colors';

interface AiWorkspaceModalProps {
  visible: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const AiWorkspaceModal: React.FC<AiWorkspaceModalProps> = ({
  visible,
  onClose,
  initialPrompt,
}) => {
  const {
    messages,
    isStreaming,
    activeTools,
    error,
    canRetry,
    sendMessage,
    stopStreaming,
    retryLast,
    approveAction,
    rejectAction,
  } = useAiChat();

  const [inputText, setInputText] = useState(initialPrompt || '');
  const [inputFocused, setInputFocused] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<AiActionCardData | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && initialPrompt) setInputText(initialPrompt);
  }, [visible, initialPrompt]);

  // Pulsing dot animation while streaming
  useEffect(() => {
    if (isStreaming) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isStreaming]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isStreaming) return;
    if (!overrideText) setInputText('');
    void sendMessage(text);
  };

  const handleApprovePress = (action: AiActionCardData) => {
    if (action.requiresPin) setPendingPinAction(action);
    else void approveAction(action.id);
  };

  const handlePinSubmitted = (enteredPin: string) => {
    const target = pendingPinAction;
    setPendingPinAction(null);
    if (!target) return;
    void approveAction(target.id, enteredPin);
  };

  const isEmpty = messages.length === 0;

  return (
    <AdaptiveModal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <View style={styles.logoBox}>
                <Sparkles size={18} color="#FFFFFF" />
              </View>
            </View>
            <View>
              <Text style={styles.headerTitle}>FinPilot AI</Text>
              <View style={styles.statusRow}>
                <Animated.View style={[styles.statusDot, { opacity: isStreaming ? pulseAnim : 1 }]} />
                <Text style={styles.statusText}>
                  {isStreaming ? 'Thinking…' : 'Ready'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Empty State ── */}
        {isEmpty && !isStreaming ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRing}>
              <Bot size={36} color={colors.tealPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Your AI Financial Copilot</Text>
            <Text style={styles.emptySubtitle}>
              Ask me about your balance, budget, investments, transfers, fraud checks — anything financial.
            </Text>
            <View style={styles.capRow}>
              {['💰 Budgets', '📈 Invest', '🔐 Fraud', '💸 Transfers'].map((cap) => (
                <View key={cap} style={styles.capChip}>
                  <Text style={styles.capText}>{cap}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* ── Message Thread ── */
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg}>
                {msg.action ? (
                  <ApprovalCard
                    action={msg.action}
                    onApprove={handleApprovePress}
                    onReject={(act) => void rejectAction(act.id)}
                  />
                ) : null}
              </ChatMessageBubble>
            ))}

            {/* Active Tool Chips */}
            {activeTools.length > 0 && (
              <View style={styles.toolsRow}>
                {activeTools.map((chip) => (
                  <ToolActivityChip key={chip.tool} chip={chip} />
                ))}
              </View>
            )}

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                {canRetry && (
                  <TouchableOpacity onPress={retryLast} style={styles.retryBtn}>
                    <RotateCcw size={13} color={colors.tealPrimary} />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Suggested Prompts ── */}
        <SuggestedPrompts onSelect={(p) => handleSend(p)} disabled={isStreaming} />

        {/* ── Input Bar ── */}
        <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
          <View style={styles.inputWrap}>
            <Zap size={16} color={inputFocused ? colors.tealPrimary : colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything financial…"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={() => handleSend()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="send"
              editable={!isStreaming}
              multiline
              maxLength={500}
              accessibilityLabel="Message input"
            />
          </View>

          {isStreaming ? (
            <TouchableOpacity onPress={stopStreaming} style={styles.stopBtn} accessibilityLabel="Stop">
              <Square size={15} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              accessibilityLabel="Send"
            >
              <Send size={17} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── PIN Authorization ── */}
        <PinScreen
          visible={Boolean(pendingPinAction)}
          pinLength={AI_PIN_LENGTH}
          onSuccess={() => undefined}
          onSubmitPin={handlePinSubmitted}
          onCancel={() => setPendingPinAction(null)}
          title="Authorize Agent Action"
          subtitle={`Enter your ${AI_PIN_LENGTH}-digit PIN to approve ${pendingPinAction?.actionType.replace(/_/g, ' ') || 'action'}`}
        />
      </KeyboardAvoidingView>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    position: 'relative',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.tealPrimary,
    opacity: 0.15,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(241,245,249,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty State */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,212,148,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0,212,148,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  capRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  capChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,212,148,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  capText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },

  /* Chat */
  chatScroll: { flex: 1 },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,212,148,0.3)',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tealPrimary,
  },

  /* Input */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.6)',
    gap: 10,
  },
  inputContainerFocused: {
    borderTopColor: 'rgba(0,212,148,0.3)',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(226,232,240,0.9)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  inputIcon: {
    marginTop: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  stopBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.coralAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coralAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});
