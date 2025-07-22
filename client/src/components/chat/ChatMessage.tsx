import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Bot, 
  Copy, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  GitBranch,
  Database,
  Code,
  ExternalLink
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    status?: 'thinking' | 'building' | 'completed' | 'error';
    actions?: Array<{
      type: 'pr' | 'deploy' | 'file' | 'migration';
      label: string;
      url?: string;
      description?: string;
    }>;
  };
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "コピーしました",
      description: "テキストがクリップボードにコピーされました。",
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'thinking':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'building':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'pr':
        return <GitBranch className="h-4 w-4" />;
      case 'deploy':
        return <Play className="h-4 w-4" />;
      case 'file':
        return <Code className="h-4 w-4" />;
      case 'migration':
        return <Database className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`p-2 rounded-full ${
            message.type === 'user'
              ? 'bg-primary/20 border border-primary/30'
              : 'bg-gradient-to-br from-accent/20 to-secondary/20 border border-border'
          }`}>
            {message.type === 'user' ? (
              <User className="h-5 w-5 text-primary" />
            ) : (
              <Bot className="h-5 w-5 text-accent" />
            )}
          </div>

          <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
            <div className={`p-4 rounded-lg ${
              message.type === 'user'
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-gradient-to-r from-card to-card/80 border border-border'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {message.type === 'user' ? 'You' : 'Claude Code Architect'}
                </span>
                <div className="flex items-center space-x-2">
                  {message.metadata?.status && getStatusIcon(message.metadata.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-foreground whitespace-pre-wrap">
                {message.content}
              </div>

              {message.metadata?.actions && message.metadata.actions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Generated Actions
                  </h4>
                  <div className="space-y-2">
                    {message.metadata.actions.map((action, index) => (
                      <div key={index} className="p-3 bg-muted/20 rounded-md border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getActionIcon(action.type)}
                            <span className="text-sm font-medium text-foreground">{action.label}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
