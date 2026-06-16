import { motion } from 'framer-motion';
import type { Message, Persona } from '../../types';
import { UserBubble } from './UserBubble';
import { AssistantMessageGroup } from './AssistantMessageGroup';

interface AnimatedMessageProps {
  message: Message;
  persona?: Persona;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function AnimatedMessage({ message, persona = 'arona', isStreaming, onRegenerate }: AnimatedMessageProps) {
  const isUser = message.role === 'user';

  const xOffset = isUser ? 20 : -20;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10, x: xOffset }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ width: '100%' }}
    >
      {isUser && <UserBubble message={message} />}
      {!isUser && (
        <AssistantMessageGroup
          message={message}
          persona={persona}
          isStreaming={isStreaming}
          onRegenerate={onRegenerate}
        />
      )}
    </motion.div>
  );
}
