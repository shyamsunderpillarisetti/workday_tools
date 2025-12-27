import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { Core } from '@/api/integrations';
import { cn } from '@/lib/utils';

export default function MessageInput({ onSend, disabled, placeholder }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim() && files.length === 0) return;
    if (disabled) return;

    const fileUrls = files.map(f => f.url);
    onSend(message.trim(), fileUrls);
    setMessage('');
    setFiles([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const { file_url } = await Core.UploadFile({ file });
        return { name: file.name, url: file_url };
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedFiles]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      {/* File Attachments */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
            >
              <Paperclip className="w-3 h-3 text-slate-500" />
              <span className="truncate max-w-[150px] text-slate-700">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type your message..."}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-[120px] py-3 pr-12 resize-none rounded-xl",
              "border-slate-200 focus:border-red-300 focus:ring-red-200",
              "placeholder:text-slate-400"
            )}
            rows={1}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={(!message.trim() && files.length === 0) || disabled}
          className={cn(
            "h-11 w-11 rounded-xl shrink-0",
            "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
            "shadow-md shadow-red-200/50",
            "disabled:opacity-50 disabled:shadow-none"
          )}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
