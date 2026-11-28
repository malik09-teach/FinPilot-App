import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { AiChatMessage } from '../../store/ai-store';

interface ChatMessageBubbleProps {
  message: AiChatMessage;
  children?: React.ReactNode;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, children }) => {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isUser ? styles.wrapperUser : styles.wrapperAssistant,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
      accessible
      accessibilityLabel={isUser ? `You: ${message.content}` : `FinPilot: ${message.content}`}
    >
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatarBox}>
          <Sparkles size={13} color="#FFFFFF" />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {/* Assistant label */}
        {!isUser && (
          <View style={styles.assistantLabel}>
            <Text style={styles.labelText}>FinPilot AI</Text>
          </View>
        )}

        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content || (!isUser ? '…' : '')}
        </Text>

        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '90%',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  wrapperAssistant: {
    alignSelf: 'flex-start',
  },

  /* Avatar */
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 0,
    marginBottom: 2,
  },

  /* Bubble */
  bubble: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: colors.tealPrimary,
    borderBottomRightRadius: 5,
    shadowColor: colors.tealPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  /* Label */
  assistantLabel: {
    marginBottom: 6,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.tealPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* Text */
  messageText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: colors.textDark,
  },
});
