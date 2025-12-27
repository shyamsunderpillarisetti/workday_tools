import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Plus, 
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPanel({ 
  isOpen, 
  conversations, 
  currentId, 
  onSelect, 
  onClose, 
  onNewChat 
}) {
  const groupedConversations = React.useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    conversations.forEach(conv => {
      const date = new Date(conv.created_date);
      if (date >= today) {
        groups.today.push(conv);
      } else if (date >= yesterday) {
        groups.yesterday.push(conv);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });
    
    return groups;
  }, [conversations]);

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors",
                "flex items-start gap-3 group",
                currentId === conv.id 
                  ? "bg-red-50 text-red-700" 
                  : "hover:bg-slate-100 text-slate-700"
              )}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {conv.metadata?.name || 'HR Conversation'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(new Date(conv.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed lg:relative z-50 h-full w-72",
              "bg-white border-r border-slate-200",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Chat History</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNewChat}
                  className="h-8 w-8 text-slate-500"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-slate-500 lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Conversations List */}
            <ScrollArea className="flex-1 py-3">
              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No conversations yet</p>
                </div>
              ) : (
                <>
                  {renderGroup('Today', groupedConversations.today)}
                  {renderGroup('Yesterday', groupedConversations.yesterday)}
                  {renderGroup('This Week', groupedConversations.thisWeek)}
                  {renderGroup('Older', groupedConversations.older)}
                </>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
