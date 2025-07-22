import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  const { sessionId } = useParams<{ sessionId: string }>();
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Authentication ---
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '', password: '', username: ''
  });

  const login = useMutation(
    () => apiRequest('POST', '/api/login', {
      email: credentials.email,
      password: credentials.password
    }).then(r => r.json()),
    {
      onSuccess: data => {
        setUserId(data.user.id);
        setIsLoggedIn(true);
        queryClient.invalidateQueries();
        toast({ title: 'Logged in', description: `Welcome ${data.user.username}` });
      },
      onError: err => toast({ title: 'Login Failed', description: String(err), variant: 'destructive' })
    }
  );

  const register = useMutation(
    () => apiRequest('POST', '/api/register', {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password
    }).then(r => r.json()),
    {
      onSuccess: data => {
        setUserId(data.user.id);
        setIsLoggedIn(true);
        queryClient.invalidateQueries();
        toast({ title: 'Registered', description: `Welcome ${data.user.username}` });
      },
      onError: err => toast({ title: 'Registration Failed', description: String(err), variant: 'destructive' })
    }
  );

  const logout = useMutation(
    () => apiRequest('POST', '/api/logout').then(r => r.json()),
    {
      onSuccess: () => {
        setUserId(null);
        setIsLoggedIn(false);
        queryClient.clear();
        toast({ title: 'Logged out' });
      },
      onError: err => toast({ title: 'Logout Failed', description: String(err), variant: 'destructive' })
    }
  );

  const { isLoading: loadingUser } = useQuery(
    ['current-user'],
    () => apiRequest('GET', '/api/current-user').then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    }),
    {
      retry: false,
      onSuccess: data => {
        setUserId(data.userId);
        setIsLoggedIn(true);
      },
      onError: () => setIsLoggedIn(false)
    }
  );

  // --- Chat and Code Generation ---
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const { sendMessage, isConnected } = useWebSocket('/ws');

  const { data: messages = [], isLoading: loadingMessages } = useQuery(
    ['messages', sessionId],
    () => apiRequest('GET', `/api/chat-sessions/${sessionId}/messages`).then(r => r.json()),
    { enabled: !!sessionId && isLoggedIn }
  );

  const createSession = useMutation(
    (title: string) => apiRequest('POST', '/api/chat-sessions', {
      userId, title, projectId: currentProjectId
    }).then(r => r.json()),
    { onSuccess: () => queryClient.invalidateQueries(['sessions']) }
  );

  const sendMsg = useMutation(
    ({ content, sid }: { content: string; sid: number }) =>
      apiRequest('POST', `/api/chat-sessions/${sid}/messages`, {
        type: 'user', content
      }).then(r => r.json()),
    { onSuccess: (_, vars) => queryClient.invalidateQueries(['messages', vars.sid]) }
  );

  const generateCode = useMutation(
    (prompt: string) => apiRequest('POST', '/api/generate-code', {
      prompt, projectId: currentProjectId
    }).then(r => r.json()),
    {
      onSuccess: data => {
        queryClient.invalidateQueries(['files', currentProjectId]);
        toast({ title: 'Code Generated', description: `Generated ${data.files?.length} files` });
      },
      onError: err => toast({ title: 'Error', description: String(err), variant: 'destructive' })
    }
  );

  // --- Effects and Handlers ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setIsBuilding(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const session = await createSession.mutateAsync(text.slice(0, 50));
        sid = session.id.toString();
      }
      await sendMsg.mutateAsync({ content: text, sid: Number(sid) });
      if (/api|backend/i.test(text)) {
        await generateCode.mutateAsync(text);
      }
      if (isConnected) {
        sendMessage({ type: 'chat', content: text });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsBuilding(false);
    }
  };

  // --- Conditional Rendering ---
  if (loadingUser) return <div>Loading user session...</div>;

  if (!isLoggedIn) {
    return (
      <div className="auth-form">
        <Label>Email</Label>
        <Input
          value={credentials.email}
          onChange={e => setCredentials(prev => ({ ...prev, email: e.target.value }))}
        />
        <Label>Password</Label>
        <Input
          type="password"
          value={credentials.password}
          onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))}
        />
        <Button onClick={() => login.mutate()} disabled={login.isLoading}>
          {login.isLoading ? 'Logging in...' : 'Login'}
        </Button>
        <Button onClick={() => register.mutate()} disabled={register.isLoading}>
          {register.isLoading ? 'Registering...' : 'Register'}
        </Button>
      </div>
    );
  }

  return (
    <AppLayout
      header={<h1>AI Code Architect</h1>}
      sidebar={
        <div>
          <Button onClick={() => logout.mutate()} disabled={logout.isLoading}>
            Logout
          </Button>
          {/* ここにプロジェクトやファイル一覧を配置 */}
        </div>
      }
    >
      <ScrollArea ref={scrollRef} className="chat-area">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg as Message} />
        ))}
        {isBuilding && <div>AI is generating code...</div>}
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isBuilding} />
    </AppLayout>
  );
}
