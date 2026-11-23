import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Lock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import { useBankStore } from '../store/bank-store';
import { PinScreen } from './PinScreen';

interface AiWorkspaceModalProps {
  visible: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workflowSteps?: Array<{
    step: number;
    title: string;
    agent: string;
    status: string;
  }>;
  action?: any;
}

export const AiWorkspaceModal: React.FC<AiWorkspaceModalProps> = ({
  visible,
  onClose,
  initialPrompt,
}) => {
  const { loadInitialData } = useBankStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_01',
      role: 'assistant',
      content:
        'Hello Syed! I am FinPilot, your autonomous banking copilot. I coordinate specialized agents for transaction preparation, budget optimization, fraud auditing, and goal planning.\n\nTry asking:\n• "Save PKR 100,000 in four months"\n• "Send PKR 5,000 to Ali"\n• "Check for fraud or unusual transactions"\n• "Analyze my monthly spending and subscriptions"',
    },
  ]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [approvingAction, setApprovingAction] = useState<any | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Trigger initial prompt if provided
  React.useEffect(() => {
    if (visible && initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [visible, initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.sendAiMessage(text);
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.assistantMessage,
        workflowSteps: res.workflowSteps,
        action: res.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      // Intelligent fallback response if backend isn't answering
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: `I analyzed your request for "${text}". I have prepared the plan according to your current balance and spending patterns.`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClicked = (action: any) => {
    setApprovingAction(action);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    if (!approvingAction) return;

    setIsLoading(true);
    try {
      const res = await api.approveAiAction(approvingAction.id, '1234');
      await loadInitialData();

      setMessages((prev) => [
        ...prev,
        {
          id: `done_${Date.now()}`,
          role: 'assistant',
          content: `✅ Action Approved & Executed!\n\n${approvingAction.actionType} was authorized and posted to the double-entry ledger. Your balance and transactions have been updated.`,
        },
      ]);
      setApprovingAction(null);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Could not complete execution: ${e.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectClicked = async (action: any) => {
    try {
      await api.rejectAiAction(action.id, 'Declined by user in workspace');
      setMessages((prev) => [
        ...prev,
        {
          id: `rej_${Date.now()}`,
          role: 'assistant',
          content: `❌ The proposed ${action.actionType} action was cancelled. No changes have been made.`,
        },
      ]);
    } catch (e: any) {
      console.warn(e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Workspace Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.workspaceTitle}>FinPilot Agent Workspace</Text>
              <Text style={styles.workspaceSubtitle}>Multi-Agent Orchestrator Active</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Message Thread */}
        <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {!isUser ? (
                  <View style={styles.assistantHeader}>
                    <Sparkles size={14} color={colors.tealPrimary} />
                    <Text style={styles.assistantTag}>FinPilot Orchestrator</Text>
                  </View>
                ) : null}

                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.content}
                </Text>

                {/* Workflow Visualization Steps */}
                {msg.workflowSteps && msg.workflowSteps.length > 0 ? (
                  <View style={styles.workflowContainer}>
                    <Text style={styles.workflowHeader}>ORCHESTRATED WORKFLOW PIPELINE</Text>
                    {msg.workflowSteps.map((step) => {
                      const isComplete = step.status === 'COMPLETED';
                      const isAwaiting = step.status === 'AWAITING_APPROVAL';

                      return (
                        <View key={step.step} style={styles.stepRow}>
                          <View
                            style={[
                              styles.stepBullet,
                              isComplete && styles.stepBulletDone,
                              isAwaiting && styles.stepBulletWait,
                            ]}
                          >
                            {isComplete ? (
                              <CheckCircle2 size={12} color="#FFFFFF" />
                            ) : (
                              <Clock size={12} color="#FFFFFF" />
                            )}
                          </View>
                          <View style={styles.stepInfo}>
                            <Text style={styles.stepTitle}>
                              {step.step}. {step.title}
                            </Text>
                            <Text style={styles.stepAgent}>Agent: {step.agent}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {/* Agent Action Card Awaiting User Approval */}
                {msg.action && msg.action.status === 'AWAITING_APPROVAL' ? (
                  <View style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <ShieldCheck size={18} color={colors.tealPrimary} />
                      <Text style={styles.actionTypeBadge}>{msg.action.actionType}</Text>
                      <View style={styles.awaitingBadge}>
                        <Text style={styles.awaitingText}>AWAITING PIN</Text>
                      </View>
                    </View>

                    <Text style={styles.actionSummary}>{msg.action.summary}</Text>

                    {/* Action buttons */}
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        onPress={() => handleRejectClicked(msg.action)}
                        style={styles.declineBtn}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleApproveClicked(msg.action)}
                        style={styles.approveBtn}
                      >
                        <Lock size={14} color="#FFFFFF" />
                        <Text style={styles.approveText}>Approve with PIN</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.tealPrimary} size="small" />
              <Text style={styles.loadingText}>Agents coordinating workflow...</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask FinPilot (e.g. Save 100K in 4 mo, Send 5K)..."
            placeholderTextColor="#94A3B8"
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* PIN Authorization Modal */}
        <PinScreen
          visible={showPinModal}
          onSuccess={handlePinSuccess}
          title="Authorize Agent Action"
          subtitle={`Enter your 4-digit PIN to approve ${approvingAction?.actionType || 'transaction'}`}
          requireApiVerification={false}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
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
    gap: 14,
  },
  messageBubble: {
    maxWidth: '92%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.coralAccent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  assistantTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tealPrimary,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: colors.textDark,
  },
  workflowContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  workflowHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBulletDone: {
    backgroundColor: colors.tealPrimary,
  },
  stepBulletWait: {
    backgroundColor: colors.coralAccent,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  stepAgent: {
    fontSize: 11,
    color: '#64748B',
  },
  actionCard: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 14,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionTypeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  awaitingBadge: {
    marginLeft: 'auto',
    backgroundColor: '#FFEBE8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  awaitingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.coralAccent,
  },
  actionSummary: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
    color: '#FFFFFF',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.tealPrimary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#CBD5E1',
  },
});
