import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Project, ChatMessage as ChatMessageType, GeneratedFile } from "@shared/schema";
import {
  Bot,
  Code,
  Database,
  Play,
  CheckCircle,
  GitBranch,
  ExternalLink,
  Download
} from "lucide-react";

// Mock user ID - in production, this would come from authentication
const CURRENT_USER_ID = 1;

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

export default function Chat() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // WebSocket connection for real-time chat
  const { sendMessage, isConnected } = useWebSocket('/ws');

  // Fetch chat messages if sessionId exists
  const { data: messages = [], isLoading } = useQuery<ChatMessageType[]>({
    queryKey: sessionId ? [`/api/chat-sessions/${sessionId}/messages`] : [],
    enabled: !!sessionId,
  });

  // Fetch current project
  const { data: project } = useQuery<Project>({
    queryKey: currentProjectId ? [`/api/projects/${currentProjectId}`] : [],
    enabled: !!currentProjectId,
  });

  // Fetch generated files for current project
  const { data: generatedFiles = [] } = useQuery<GeneratedFile[]>({
    queryKey: currentProjectId ? [`/api/projects/${currentProjectId}/files`] : [],
    enabled: !!currentProjectId,
  });

  // Create new chat session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { title: string; projectId?: number }) => {
      const response = await apiRequest('POST', '/api/chat-sessions', {
        userId: CURRENT_USER_ID,
        title: data.title,
        projectId: data.projectId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-sessions'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; sessionId: number }) => {
      const response = await apiRequest('POST', `/api/chat-sessions/${data.sessionId}/messages`, {
        type: 'user',
        content: data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat-sessions', sessionId, 'messages'] });
      }
    },
  });

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: { prompt: string; projectId?: number }) => {
      const response = await apiRequest('POST', '/api/generate-code', {
        prompt: data.prompt,
        projectId: data.projectId,
        techStack: ['FastAPI', 'PostgreSQL', 'Docker'],
        projectType: 'Backend API',
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (currentProjectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', currentProjectId, 'files'] });
      }
      toast({
        title: "Code Generated Successfully!",
        description: `Generated ${result.files?.length || 0} files for your project.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Code Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsBuilding(true);

      // Create session if it doesn't exist
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createSessionMutation.mutateAsync({
          title: content.slice(0, 50),
          projectId: currentProjectId || undefined,
        });
        currentSessionId = session.id;
      }

      // Send user message
      await sendMessageMutation.mutateAsync({
        content,
        sessionId: parseInt(currentSessionId!),
      });

      // Generate code if this is a code generation request
      if (content.toLowerCase().includes('api') || content.toLowerCase().includes('backend')) {
        await generateCodeMutation.mutateAsync({
          prompt: content,
          projectId: currentProjectId || undefined,
        });
      }

      // Send real-time message via WebSocket
      if (isConnected) {
        sendMessage({
          type: 'chat',
          content,
          context: project ? `Project: ${project.name}` : undefined,
        });
      }

    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuilding(false);
    }
  };

  // Transform API messages to UI format
  const uiMessages: Message[] = messages.map((msg) => ({
    id: msg.id.toString(),
    type: msg.type as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.createdAt),
    metadata: msg.metadata as any,
  }));

  // Add welcome message if no messages exist
  if (uiMessages.length === 0) {
    uiMessages.unshift({
      id: 'welcome',
      type: 'assistant',
      content: 'こんにちは！Chat Code Architect AI へようこそ。\n\n自然言語でバックエンドアプリケーションを構築できます。どのようなプロジェクトを作成したいですか？\n\n💡 Example prompts:\n• "FastAPIでユーザー認証機能付きのREST APIを作成"\n• "Node.js + MongoDB でリアルタイムチャットAPI"\n• "Pythonでマイクロサービス アーキテクチャ"',
      timestamp: new Date(),
      metadata: { status: 'completed' },
    });
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-border p-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">AI Code Architect</h1>
                <p className="text-sm text-muted-foreground">自然言語でバックエンドアプリケーションを構築</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                  isConnected 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-medium">
                    {isConnected ? 'AI Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-4xl mx-auto">
              {uiMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isBuilding && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-accent/20">
                      <Bot className="h-5 w-5 text-accent" />
                    </div>
                    <div className="p-4 bg-gradient-to-r from-card to-card/80 border border-border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse h-2 w-2 bg-accent rounded-full" />
                        <span className="text-sm text-foreground">AI is generating your code...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <ChatInput onSendMessage={handleSendMessage} disabled={isBuilding} />
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Active Project */}
          {project && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm font-medium text-foreground">{project.name}</div>
                <div className="text-xs text-muted-foreground">{project.description}</div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.techStack?.map((tech: string) => (
                    <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${
                    project.status === 'completed' ? 'bg-green-500' :
                    project.status === 'building' ? 'bg-yellow-500' :
                    project.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-xs text-muted-foreground capitalize">{project.status}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Files */}
          {generatedFiles.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Generated Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {generatedFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-2 hover:bg-accent/20 rounded-md transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Code className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-foreground truncate">{file.filename}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Code className="w-3 h-3 mr-2" />
                REST API with Auth
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Database className="w-3 h-3 mr-2" />
                GraphQL API
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <GitBranch className="w-3 h-3 mr-2" />
                Microservices
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Play className="w-3 h-3 mr-2" />
                Real-time Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
