import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { AiChatMessage } from '../../store/ai-store';

interface ChatMessageBubbleProps {
  message: AiChatMessage;
  children?: React.ReactNode;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  children,
}) => {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
      accessible
      accessibilityLabel={
        isUser ? `You said: ${message.content}` : `FinPilot said: ${message.content}`
      }
    >
      {!isUser ? (
        <View style={styles.assistantHeader}>
          <Sparkles size={13} color={colors.tealPrimary} />
          <Text style={styles.assistantTag}>FinPilot Copilot</Text>
        </View>
      ) : null}

      <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
        {message.content || (isUser ? '' : '...')}
      </Text>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '90%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.coralAccent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
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
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: colors.textLight,
    fontWeight: '500',
  },
  assistantText: {
    color: colors.textDark,
  },
});
