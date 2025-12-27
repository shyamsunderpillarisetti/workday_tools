import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { AnimatePresence, motion } from 'framer-motion';

export default function MessageList({ messages, isTyping, onFeedback }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <MessageBubble 
              message={message} 
              onFeedback={onFeedback}
              showFeedback={message.role === 'assistant'}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TypingIndicator />
        </motion.div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
