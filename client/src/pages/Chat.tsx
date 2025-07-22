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
import { Input } from "@/components/ui/input"; // Inputをインポート
import { Label } from "@/components/ui/label"; // Labelをインポート
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

// 認証済みユーザーIDを管理
const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

// 認証済みユーザーIDを管理
const [currentUserId, setCurrentUserId] = useState<number | null>(null);

export default function Chat() {
 const { sessionId } = useParams();
 const { toast } = useToast();
 const scrollAreaRef = useRef<HTMLDivElement>(null);
 const [isBuilding, setIsBuilding] = useState(false);
 const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
 const [isLoggedIn, setIsLoggedIn] = useState(false); // ログイン状態を管理
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [email, setEmail] = useState(""); // 登録用

 // WebSocket connection for real-time chat
 const { sendMessage, isConnected } = useWebSocket('/ws');

 // 現在のユーザー情報を取得
 const { data: currentUser, isLoading: isLoadingUser } = useQuery<{ userId: number }>({
   queryKey: ['/api/current-user'],
   queryFn: async () => {
     const response = await apiRequest('GET', '/api/current-user');
     if (response.status === 200) {
       const data = await response.json();
       setCurrentUserId(data.userId);
       setIsLoggedIn(true);
       return data;
     }
     setIsLoggedIn(false);
     return null;
   },
   retry: false, // 認証エラー時にリトライしない
 });

 // Fetch chat messages if sessionId exists
 const { data: messages = [], isLoading } = useQuery<ChatMessageType[]>({
   queryKey: sessionId ? [`/api/chat-sessions/${sessionId}/messages`] : [],
   enabled: !!sessionId && isLoggedIn, // ログインしている場合のみ有効化
 });
 console.log("Fetched messages (raw):", messages); // 追加

 // Fetch current project
 const { data: project } = useQuery<Project>({
   queryKey: currentProjectId ? [`/api/projects/${currentProjectId}`] : [],
   enabled: !!currentProjectId && isLoggedIn, // ログインしている場合のみ有効化
 });

 // Fetch generated files for current project
 const { data: generatedFiles = [] } = useQuery<GeneratedFile[]>({
   queryKey: currentProjectId ? [`/api/projects/${currentProjectId}/files`] : [],
   enabled: !!currentProjectId && isLoggedIn, // ログインしている場合のみ有効化
 });

 // Create new chat session mutation
 const createSessionMutation = useMutation({
   mutationFn: async (data: { title: string; projectId?: number }) => {
     const response = await apiRequest('POST', '/api/chat-sessions', {
       userId: currentUserId, // 認証済みユーザーIDを使用
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

 // ログインミューテーション
 const loginMutation = useMutation({
   mutationFn: async (data: { email: string; password: string }) => {
     const response = await apiRequest('POST', '/api/login', data);
     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Login failed');
     }
     return response.json();
   },
   onSuccess: (data) => {
     setCurrentUserId(data.user.id);
     setIsLoggedIn(true);
     queryClient.invalidateQueries(); // 全てのクエリを無効化して再フェッチ
     toast({
       title: "Logged in successfully!",
       description: `Welcome, ${data.user.username}!`,
     });
   },
   onError: (error) => {
     toast({
       title: "Login Failed",
       description: error.message,
       variant: "destructive",
     });
   },
 });

 // 登録ミューテーション
 const registerMutation = useMutation({
   mutationFn: async (data: { username: string; email: string; password: string }) => {
     const response = await apiRequest('POST', '/api/register', data);
     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Registration failed');
     }
     return response.json();
   },
   onSuccess: (data) => {
     setCurrentUserId(data.user.id);
     setIsLoggedIn(true);
     queryClient.invalidateQueries(); // 全てのクエリを無効化して再フェッチ
     toast({
       title: "Registered successfully!",
       description: `Welcome, ${data.user.username}!`,
     });
   },
   onError: (error) => {
     toast({
       title: "Registration Failed",
       description: error.message,
       variant: "destructive",
     });
   },
 });

 // ログアウトミューテーション
 const logoutMutation = useMutation({
   mutationFn: async () => {
     const response = await apiRequest('POST', '/api/logout');
     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Logout failed');
     }
     return response.json();
   },
   onSuccess: () => {
     setCurrentUserId(null);
     setIsLoggedIn(false);
     queryClient.clear(); // 全てのキャッシュをクリア
     toast({
       title: "Logged out successfully!",
     });
   },
   onError: (error) => {
     toast({
       title: "Logout Failed",
       description: error.message,
       variant: "destructive",
     });
   },
 });

 // Auto-scroll to bottom when messages change
 useEffect(() => {
   if (scrollAreaRef.current) {
     scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
   }
   console.log("Messages updated, scrolling:", messages); // 追加
 }, [messages]);

 const handleSendMessage = async (content: string) => {
   if (!content.trim() || !currentUserId) return; // ログインしていない場合は送信しない

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
 console.log("UI messages (transformed):", uiMessages); // 追加

 // Add welcome message if no messages exist
 if (uiMessages.length === 0 && isLoggedIn) { // ログインしている場合のみウェルカムメッセージを表示
   uiMessages.unshift({
     id: 'welcome',
     type: 'assistant',
     content: 'こんにちは！Chat Code Architect AI へようこそ。\n\n自然言語でバックエンドアプリケーションを構築できます。どのようなプロジェクトを作成したいですか？\n\n💡 Example prompts:\n• "FastAPIでユーザー認証機能付きのREST APIを作成"\n• "Node.js + MongoDB でリアルタイムチャットAPI"\n• "Pythonでマイクロサービス アーキテクチャ"',
     timestamp: new Date(),
     metadata: { status: 'completed' },
   });
 }

 if (isLoadingUser) {
   return (
     <AppLayout>
       <div className="flex items-center justify-center h-full">
         <p>Loading user session...</p>
       </div>
     </AppLayout>
   );
 }

 if (!isLoggedIn) {
   return (
     <AppLayout>
       <div className="flex items-center justify-center h-full bg-background">
         <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle className="text-2xl text-center">Welcome to AI Code Architect</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="m@example.com"
                 value={email}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="password">Password</Label>
               <Input
                 id="password"
                 type="password"
                 value={password}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                 required
               />
             </div>
             <Button
               className="w-full"
               onClick={() => loginMutation.mutate({ email, password })}
               disabled={loginMutation.isPending}
             >
               {loginMutation.isPending ? "Logging in..." : "Login"}
             </Button>
             <div className="text-center text-sm text-muted-foreground">
               Don't have an account?{" "}
               <Button
                 variant="link"
                 className="p-0 h-auto"
                 onClick={() => registerMutation.mutate({ username: email.split('@')[0], email, password })}
                 disabled={registerMutation.isPending}
               >
                 {registerMutation.isPending ? "Registering..." : "Register"}
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
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
               <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                 Logout
               </Button>
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
