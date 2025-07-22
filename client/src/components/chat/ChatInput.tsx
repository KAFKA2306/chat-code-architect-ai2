import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Play, Code, CheckCircle, Database, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="FastAPIでユーザー認証機能を追加してください..."
                className="min-h-[44px] max-h-32 resize-none pr-12"
                disabled={disabled}
                rows={1}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                disabled={disabled}
              >
                <Paperclip className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={!message.trim() || disabled}
              className="px-6"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Send</span>
            </Button>
          </div>

          {/* Input Hints */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <Play className="h-3 w-3" />
                <span>Plan</span>
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <Code className="h-3 w-3" />
                <span>Build</span>
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Test</span>
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <Database className="h-3 w-3" />
                <span>Deploy</span>
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
