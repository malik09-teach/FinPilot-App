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
} from 'react-native';
import { Sparkles, Send, X, Square, RotateCcw } from 'lucide-react-native';
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
  const [pendingPinAction, setPendingPinAction] = useState<AiActionCardData | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);

  useEffect(() => {
    if (visible && initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [visible, initialPrompt]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isStreaming) return;
    if (!overrideText) setInputText('');
    void sendMessage(text);
  };

  const handleApprovePress = (action: AiActionCardData) => {
    if (action.requiresPin) {
      setPendingPinAction(action);
    } else {
      void approveAction(action.id);
    }
  };

  const handlePinSubmitted = (enteredPin: string) => {
    const target = pendingPinAction;
    setPendingPinAction(null);
    if (!target) return;
    void approveAction(target.id, enteredPin);
  };

  return (
    <AdaptiveModal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.workspaceTitle}>FinPilot AI Copilot</Text>
              <Text style={styles.workspaceSubtitle}>
                {isStreaming ? 'Thinking & checking...' : 'Ready to assist'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close AI Copilot"
          >
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Message Thread */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
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

          {activeTools.length > 0 ? (
            <View style={styles.toolsRow}>
              {activeTools.map((chip) => (
                <ToolActivityChip key={chip.tool} chip={chip} />
              ))}
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              {canRetry ? (
                <TouchableOpacity
                  onPress={retryLast}
                  style={styles.retryBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Retry last message"
                >
                  <RotateCcw size={14} color={colors.tealPrimary} />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Suggested Prompts */}
        <SuggestedPrompts onSelect={(p) => handleSend(p)} disabled={isStreaming} />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask FinPilot (e.g. Save 100K, Send 2,000)..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!isStreaming}
            accessibilityLabel="AI Copilot message input"
          />
          {isStreaming ? (
            <TouchableOpacity
              onPress={stopStreaming}
              style={styles.stopBtn}
              accessibilityRole="button"
              accessibilityLabel="Stop generating"
            >
              <Square size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* PIN Authorization Modal (no hardcoded PIN; clears immediately after submit) */}
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
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: colors.backgroundFrost,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  workspaceSubtitle: {
    fontSize: 12,
    color: colors.tealPrimary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tealPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundFrost,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textDark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  stopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coralAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
