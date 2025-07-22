# Code Architect AI - 開発者ガイド

## プロジェクト概要

Code Architect AIは、自然言語でバックエンドコードを生成するフルスタックWebアプリケーションです。ReactフロントエンドとExpress.jsバックエンドで構築されており、OpenAI GPT-4oを使用してインテリジェントなコード生成を行います。

## アーキテクチャ

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │────│ Express Backend │────│   PostgreSQL    │
│   (Vite + TS)   │    │   (TypeScript)  │    │   (Neon DB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  OpenAI GPT-4o  │──────────────┘
                        │  Code Generation │
                        └─────────────────┘
```

### テクノロジースタック

#### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - スタイリング
- **Radix UI + shadcn/ui** - UIコンポーネント
- **TanStack Query** - サーバー状態管理
- **Wouter** - 軽量ルーティング
- **WebSocket** - リアルタイム通信

#### バックエンド
- **Node.js + Express** - サーバーランタイム
- **TypeScript** - 型安全性
- **Drizzle ORM** - データベースORM
- **PostgreSQL** - データベース（Neon serverless）
- **OpenAI API** - AI機能
- **WebSocket** - リアルタイム通信

## セットアップ

### 前提条件
- Node.js 18以上
- PostgreSQL データベース
- OpenAI API キー

### インストール
```bash
# リポジトリのクローン
git clone [repository-url]
cd chat-code-architect-ai

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
```

### 環境変数
```env
# データベース
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# その他
NODE_ENV=development
```

### データベース設定
```bash
# スキーマをデータベースに適用
npm run db:push

# 開発用データの投入（オプション）
npm run db:seed
```

### 開発サーバー起動
```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

## プロジェクト構造

```
├── client/                 # フロントエンドコード
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/           # ユーティリティライブラリ
│   │   ├── pages/         # ページコンポーネント
│   │   └── main.tsx       # エントリーポイント
│   └── index.html
├── server/                 # バックエンドコード
│   ├── index.ts           # サーバーエントリーポイント
│   ├── routes.ts          # APIルート
│   ├── storage.ts         # データベースアクセス層
│   ├── db.ts             # データベース接続
│   ├── openai.ts         # OpenAI統合
│   └── vite.ts           # Vite統合
├── shared/                # 共有型定義
│   └── schema.ts         # Drizzleスキーマ
├── docs/                  # ドキュメント
└── package.json
```

## データベーススキーマ

### 主要テーブル

#### users（ユーザー）
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### projects（プロジェクト）
```typescript
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).default('planning').notNull(),
  techStack: text("tech_stack").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### chatSessions（チャットセッション）
```typescript
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### chatMessages（チャットメッセージ）
```typescript
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## API エンドポイント

### プロジェクト関連
```typescript
GET    /api/projects              // ユーザーのプロジェクト一覧
POST   /api/projects              // 新しいプロジェクト作成
GET    /api/projects/:id          // プロジェクト詳細
PUT    /api/projects/:id          // プロジェクト更新
DELETE /api/projects/:id          // プロジェクト削除
GET    /api/projects/:id/files    // プロジェクトファイル一覧
```

### チャット関連
```typescript
GET    /api/chat-sessions                    // チャットセッション一覧
POST   /api/chat-sessions                    // 新しいセッション作成
GET    /api/chat-sessions/:id               // セッション詳細
GET    /api/chat-sessions/:id/messages      // メッセージ一覧
POST   /api/chat-sessions/:id/messages      // メッセージ送信
```

### AI関連
```typescript
POST   /api/ai/generate-code     // コード生成
POST   /api/ai/analyze-project   // プロジェクト分析
POST   /api/ai/suggest-improvements // 改善提案
```

## フロントエンド開発

### コンポーネント構成
```
components/
├── ui/              # 基本UIコンポーネント（shadcn/ui）
├── layout/          # レイアウトコンポーネント
├── chat/           # チャット関連コンポーネント
├── projects/       # プロジェクト管理コンポーネント
└── common/         # 共通コンポーネント
```

### 状態管理

#### TanStack Query
- サーバー状態の管理
- キャッシング
- 楽観的更新

```typescript
// プロジェクト一覧の取得
const { data: projects, isLoading } = useQuery<Project[]>({
  queryKey: [`/api/projects?userId=${userId}`],
});

// プロジェクト作成
const createProject = useMutation({
  mutationFn: (newProject: InsertProject) =>
    apiRequest('POST', '/api/projects', newProject),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/projects']);
  },
});
```

#### WebSocket通信
```typescript
// カスタムWebSocketフック
const { sendMessage, isConnected } = useWebSocket('/ws');

// メッセージ送信
const handleSendMessage = (message: string) => {
  sendMessage({
    type: 'chat_message',
    payload: { content: message, sessionId }
  });
};
```

## バックエンド開発

### ミドルウェア構成
```typescript
app.use(express.json());
app.use(cors());
app.use(session(/* session config */));
app.use(passport.initialize());
app.use(passport.session());
```

### ストレージ層
データベースアクセスは`IStorage`インターフェースを実装した`DatabaseStorage`クラスで抽象化されています。

```typescript
interface IStorage {
  // ユーザー関連
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // プロジェクト関連
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // チャット関連
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}
```

### OpenAI統合
```typescript
// コード生成機能
async function generateCode(prompt: string): Promise<GeneratedCode> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // 最新のOpenAIモデル
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

## 開発ワークフロー

### 1. 機能開発
```bash
# 機能ブランチの作成
git checkout -b feature/new-feature

# 開発
npm run dev

# テスト
npm run test

# ビルド確認
npm run build
```

### 2. データベース変更
```bash
# スキーマ変更後
npm run db:push

# 本番環境では適切な移行戦略を使用
```

### 3. 型安全性
- すべてのAPIエンドポイントで型を定義
- 共有型定義は`shared/schema.ts`に配置
- フロントエンドとバックエンドで一貫した型使用

## テスト

### フロントエンドテスト
```bash
# コンポーネントテスト
npm run test:frontend

# E2Eテスト
npm run test:e2e
```

### バックエンドテスト
```bash
# APIテスト
npm run test:api

# 統合テスト
npm run test:integration
```

## デプロイ

### 本番ビルド
```bash
npm run build
```

### 環境変数
本番環境では以下の環境変数を設定：
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `NODE_ENV=production`
- セッション秘密鍵

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

## トラブルシューティング

### よくある問題

#### データベース接続エラー
```bash
# 接続確認
npm run db:check

# スキーマリセット
npm run db:reset
```

#### WebSocket接続問題
- プロキシ設定の確認
- ファイアウォール設定
- CORS設定

#### OpenAI API エラー
- API制限確認
- 認証情報確認
- レート制限対応

## 貢献ガイドライン

### コーディング規約
- TypeScript厳格モード使用
- ESLint + Prettier設定に従う
- コンポーネントはPascalCase
- ファイル名はkebab-case

### コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
```

---

*開発に関する質問は、プロジェクトのIssuesまたは開発チャットでお気軽にお聞きください。*