import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent
} from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';

import { AppLayout } from '@/components/layout/AppLayout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

import type {
  Project,
  ChatMessage as ApiMessage,
  GeneratedFile
} from '@shared/schema';

/* ---------- 型 ---------- */

interface UIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ---------- コンポーネント ---------- */

export default function Chat() {
  /* --- basic refs / params --- */
  const { sessionId } = useParams<{ sessionId?: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /* --- auth state --- */
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cred, setCred] = useState({ email: '', password: '' });

  /* --- chat / project state --- */
  const [isBuilding, setIsBuilding] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);

  /* --- websocket --- */
  const { isConnected, sendMessage: wsSend } = useWebSocket('/ws');

  /* ---------- 認証 ---------- */

  /* 現在のユーザーを取得 */
  useQuery(
    ['/api/current-user'],
    async () => {
      const r = await apiRequest('GET', '/api/current-user');
      if (!r.ok) throw new Error();
      return r.json() as Promise<{ userId: number }>;
    },
    {
      retry: false,
      onSuccess: ({ userId }) => {
        setUserId(userId);
        setIsLoggedIn(true);
      },
      onError: () => setIsLoggedIn(false)
    }
  );

  const login = useMutation(
    () => apiRequest('POST', '/api/login', cred).then(r => r.json()),
    {
      onSuccess: data => {
        setUserId(data.user.id);
        setIsLoggedIn(true);
        queryClient.invalidateQueries();
        toast({ title: 'Logged in', description: `Welcome ${data.user.username}` });
      },
      onError: err =>
        toast({
          title: 'Login failed',
          description: String(err),
          variant: 'destructive'
        })
    }
  );

  const logout = useMutation(
    () => apiRequest('POST', '/api/logout'),
    {
      onSuccess: () => {
        setUserId(null);
        setIsLoggedIn(false);
        queryClient.clear();
      }
    }
  );

  /* ---------- データ取得 ---------- */

  const { data: messages = [] } = useQuery<ApiMessage[]>(
    ['/api/chat-sessions', sessionId, 'messages'],
    () =>
      apiRequest(
        'GET',
        `/api/chat-sessions/${sessionId}/messages`
      ).then(r => r.json()),
    { enabled: !!sessionId && isLoggedIn }
  );

  const { data: project } = useQuery<Project>(
    ['/api/projects', projectId],
    () =>
      apiRequest('GET', `/api/projects/${projectId}`).then(r => r.json()),
    { enabled: !!projectId && isLoggedIn }
  );

  const { data: files = [] } = useQuery<GeneratedFile[]>(
    ['/api/projects', projectId, 'files'],
    () =>
      apiRequest('GET', `/api/projects/${projectId}/files`).then(r => r.json()),
    { enabled: !!projectId && isLoggedIn }
  );

  /* ---------- ミューテーション ---------- */

  const createSession = useMutation(
    (title: string) =>
      apiRequest('POST', '/api/chat-sessions', {
        userId,
        title,
        projectId
      }).then(r => r.json())
  );

  const postMessage = useMutation(
    ({ sid, content }: { sid: number; content: string }) =>
      apiRequest('POST', `/api/chat-sessions/${sid}/messages`, {
        type: 'user',
        content
      }).then(r => r.json()),
    {
      onSuccess: (_, { sid }) =>
        queryClient.invalidateQueries(['/api/chat-sessions', String(sid), 'messages'])
    }
  );

  /* ---------- UI 用データ整形 ---------- */

  const uiMessages: UIMessage[] =
    messages.map(m => ({
      id: String(m.id),
      type: m.type as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.createdAt)
    })) || [];

  /* ---------- ハンドラ ---------- */

  const handleSend = async (text: string) => {
    if (!text.trim() || !isLoggedIn) return;
    setIsBuilding(true);

    let sid = sessionId;
    try {
      /* セッションが無い場合は作成 */
      if (!sid) {
        const { id } = await createSession.mutateAsync(text.slice(0, 50));
        sid = String(id);
      }

      await postMessage.mutateAsync({ sid: Number(sid), content: text });

      /* WebSocket へ転送 */
      if (isConnected) wsSend({ type: 'chat', content: text });
    } finally {
      setIsBuilding(false);
    }
  };

  /* ---------- スクロール追従 ---------- */

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [uiMessages]);

  /* ---------- 未ログイン画面 ---------- */

  if (!isLoggedIn) {
    const onChange =
      (key: 'email' | 'password') =>
      (e: ChangeEvent<HTMLInputElement>) =>
        setCred({ ...cred, [key]: e.target.value });

    const onSubmit = (e: FormEvent) => {
      e.preventDefault();
      login.mutate();
    };

    return (
      <AppLayout>
        <form onSubmit={onSubmit} className="flex items-center justify-center h-full">
          <Card className="w-80 space-y-4 p-6">
            <CardHeader>
              <CardTitle className="text-center text-lg">AI Code Architect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={cred.email} onChange={onChange('email')} required />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={cred.password}
                  onChange={onChange('password')}
                  required
                />
              </div>
              <Button className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </AppLayout>
    );
  }

  /* ---------- チャット画面 ---------- */

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* main */}
        <div className="flex flex-1 flex-col">
          {/* header */}
          <div className="border-b p-4 flex justify-between">
            <h1 className="text-lg font-semibold">AI Code Architect</h1>
            <Button size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Logout
            </Button>
          </div>

          {/* messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
            {uiMessages.map(m => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {isBuilding && <p className="text-sm text-muted-foreground">Sending...</p>}
          </ScrollArea>

          {/* input */}
          <ChatInput onSendMessage={handleSend} disabled={isBuilding} />
        </div>

        {/* side panel */}
        <aside className="w-72 border-l p-4 space-y-4">
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{project.name}</p>
              </CardContent>
            </Card>
          )}

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generated Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {files.map(f => (
                  <p key={f.id} className="text-xs truncate">
                    {f.filename}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
