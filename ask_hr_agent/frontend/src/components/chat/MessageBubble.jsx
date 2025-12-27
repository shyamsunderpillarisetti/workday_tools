import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  ExternalLink,
  CheckCircle2,
  Loader2,
  FileText,
  Calendar,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CitationBadge = ({ citation }) => (
  <a 
    href={citation.url || '#'}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-100"
    title={citation.snippet || ''}
  >
    <FileText className="w-3 h-3" />
    <span className="truncate max-w-[150px]">{citation.title || citation.doc_id || 'Reference'}</span>
    {citation.confidence && <span className="opacity-70 text-[10px] ml-1">({Math.round(citation.confidence * 100)}%)</span>}
    <ExternalLink className="w-3 h-3 opacity-50" />
  </a>
);

const ToolCallDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getToolIcon = (name) => {
    if (name?.includes('leave')) return Calendar;
    if (name?.includes('verification')) return Shield;
    return FileText;
  };
  
  const Icon = getToolIcon(toolCall.tool_name);
  const isComplete = toolCall.result !== undefined;
  
  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        )}
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-700 flex-1">
          {toolCall.tool_name?.replace(/_/g, ' ')}
        </span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        )}>
          {isComplete ? 'Complete' : 'Processing...'}
        </span>
      </button>
      
      {expanded && toolCall.result && (
        <div className="p-3 bg-white border-t border-slate-100">
          <pre className="text-xs text-slate-600 overflow-x-auto">
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message, onFeedback, showFeedback }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleFeedback = (type) => {
    if (onFeedback) {
      onFeedback(message.id, type);
      toast.success('Thank you for your feedback!');
    }
  };

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      )}
      
      <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser 
            ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-200/50" 
            : "bg-white border border-slate-200 shadow-sm"
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed text-slate-700">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-700">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-1" />
              )}
            </div>
          )}
        </div>
        
        {/* Citations */}
        {!isUser && message.citations?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.citations.map((citation, idx) => (
              <CitationBadge key={idx} citation={citation} />
            ))}
          </div>
        )}
        
        {/* Tool Calls */}
        {!isUser && message.tool_calls?.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {message.tool_calls.map((toolCall, idx) => (
              <ToolCallDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
        
        {/* Actions */}
        {!isUser && showFeedback && !isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600"
              onClick={handleCopy}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                message.feedback === 'positive' ? "text-green-500" : "text-slate-400 hover:text-green-500"
              )}
              onClick={() => handleFeedback('positive')}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                message.feedback === 'negative' ? "text-red-500" : "text-slate-400 hover:text-red-500"
              )}
              onClick={() => handleFeedback('negative')}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <span className="text-slate-600 font-medium text-sm">
            {message.user_name?.charAt(0) || 'U'}
          </span>
        </div>
      )}
    </div>
  );
}
