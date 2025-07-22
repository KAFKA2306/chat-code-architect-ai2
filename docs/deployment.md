# デプロイメントガイド

## 概要

Code Architect AI を本番環境にデプロイするための包括的なガイドです。複数のプラットフォームでのデプロイ方法を説明します。

## 事前準備

### 1. 環境変数の設定
以下の環境変数が必要です：

```env
# 必須
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production

# データベース詳細（Neon使用時は自動設定）
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database

# セッション設定
SESSION_SECRET=your-very-secure-session-secret
```

### 2. 依存関係の確認
```bash
# 依存関係のインストール
npm ci --only=production

# データベーススキーマの適用
npm run db:push
```

## Replit デプロイ

### 1. Replit 設定
```toml
# .replit ファイル
[deployment]
build = "npm run build"
run = "npm start"

[[ports]]
localPort = 5000
externalPort = 80
```

### 2. 環境変数設定
Replit Secretsで以下を設定：
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `SESSION_SECRET`

### 3. デプロイ実行
```bash
# ビルド
npm run build

# デプロイ
replit deployments create
```

## Vercel デプロイ

### 1. vercel.json 設定
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.ts" },
    { "src": "/(.*)", "dest": "client/dist/index.html" }
  ]
}
```

### 2. package.json 修正
```json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

### 3. デプロイ実行
```bash
# Vercel CLI インストール
npm i -g vercel

# デプロイ
vercel --prod
```

## Railway デプロイ

### 1. Dockerfile 作成
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係のコピーとインストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードのコピー
COPY . .

# ビルド
RUN npm run build

# ポートの公開
EXPOSE 5000

# アプリケーション起動
CMD ["npm", "start"]
```

### 2. railway.toml 設定
```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
```

### 3. デプロイ実行
```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト作成
railway init

# デプロイ
railway up
```

## Heroku デプロイ

### 1. Procfile 作成
```
web: npm start
```

### 2. package.json 設定
```json
{
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

### 3. デプロイ実行
```bash
# Heroku CLI インストール後
heroku create your-app-name

# 環境変数設定
heroku config:set DATABASE_URL=your-database-url
heroku config:set OPENAI_API_KEY=your-openai-key

# デプロイ
git push heroku main
```

## DigitalOcean App Platform

### 1. .do/app.yaml 作成
```yaml
name: code-architect-ai
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${DATABASE_URL}
  - key: OPENAI_API_KEY
    value: ${OPENAI_API_KEY}
```

## AWS (Elastic Beanstalk)

### 1. .ebextensions 設定
```yaml
# .ebextensions/nodecommand.config
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.17.0
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
```

### 2. デプロイ
```bash
# EB CLI インストール
pip install awsebcli

# 初期化
eb init

# 環境作成
eb create production

# デプロイ
eb deploy
```

## Google Cloud Run

### 1. Dockerfile 作成
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
ENV PORT=8080

CMD ["npm", "start"]
```

### 2. cloudbuild.yaml
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/PROJECT_ID/code-architect-ai', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/PROJECT_ID/code-architect-ai']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'code-architect-ai',
      '--image', 'gcr.io/PROJECT_ID/code-architect-ai',
      '--region', 'asia-northeast1',
      '--platform', 'managed'
    ]
```

## データベース設定

### Neon (推奨)
```bash
# Neon CLI インストール
npm install -g @neondatabase/cli

# データベース作成
neonctl databases create --name code-architect-ai

# 接続文字列取得
neonctl connection-string
```

### PostgreSQL on Railway
```bash
# Railway で PostgreSQL アドオン追加
railway add postgresql

# 環境変数の確認
railway variables
```

### Supabase
```bash
# Supabase CLI インストール
npm install -g supabase

# プロジェクト初期化
supabase init

# データベース起動
supabase start
```

## セキュリティ設定

### 1. HTTPS 設定
```javascript
// server/index.ts に追加
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. セキュリティヘッダー
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 3. レート制限
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数制限
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## モニタリング

### 1. ヘルスチェック
```javascript
// server/routes.ts に追加
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 2. ログ設定
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## パフォーマンス最適化

### 1. 静的ファイル圧縮
```javascript
import compression from 'compression';

app.use(compression());
```

### 2. キャッシング
```javascript
app.use(express.static('dist', {
  maxAge: '1y',
  etag: true
}));
```

### 3. データベース最適化
```sql
-- インデックス作成
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_generated_files_project_id ON generated_files(project_id);
```

## トラブルシューティング

### よくある問題と解決策

#### ビルドエラー
```bash
# キャッシュクリア
rm -rf node_modules package-lock.json
npm install

# TypeScript コンパイルエラー
npx tsc --noEmit
```

#### データベース接続エラー
```bash
# 接続テスト
npm run db:check

# スキーマ同期
npm run db:push
```

#### メモリ不足
```javascript
// package.json
"scripts": {
  "start": "node --max-old-space-size=2048 dist/server/index.js"
}
```

## 継続的デプロイ (CI/CD)

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      run: |
        # デプロイコマンド
        npm run deploy
```

---

*デプロイに関する質問やサポートが必要な場合は、開発チームまでお気軽にご連絡ください。*