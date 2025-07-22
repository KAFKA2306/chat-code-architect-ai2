# インストールガイド

## システム要件

### 必要なソフトウェア
- **Node.js**: バージョン18.0以上
- **npm**: バージョン8.0以上（Node.jsに含まれる）
- **PostgreSQL**: バージョン13以上（ローカル開発時）
- **Git**: バージョン管理用

### 推奨環境
- **OS**: macOS、Ubuntu 20.04+、Windows 10/11
- **メモリ**: 4GB以上
- **ストレージ**: 2GB以上の空き容量
- **ブラウザ**: Chrome、Firefox、Safari、Edge（最新版）

## インストール手順

### 1. リポジトリのクローン
```bash
# HTTPSでクローン
git clone https://github.com/your-username/chat-code-architect-ai.git

# または SSH でクローン
git clone git@github.com:your-username/chat-code-architect-ai.git

# ディレクトリに移動
cd chat-code-architect-ai
```

### 2. 依存関係のインストール
```bash
# npm を使用してパッケージをインストール
npm install

# または yarn を使用
yarn install
```

### 3. 環境変数の設定
```bash
# 環境変数ファイルのテンプレートをコピー
cp .env.example .env

# .env ファイルを編集
nano .env
```

**.env ファイルの設定例:**
```env
# データベース設定
DATABASE_URL=postgresql://username:password@localhost:5432/code_architect_ai
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=code_architect_ai

# OpenAI API 設定
OPENAI_API_KEY=sk-your-openai-api-key

# セッション設定
SESSION_SECRET=your-very-secure-session-secret-at-least-32-characters

# 環境設定
NODE_ENV=development
```

### 4. データベースのセットアップ

#### オプション A: ローカル PostgreSQL
```bash
# PostgreSQL サービス開始（macOS）
brew services start postgresql

# PostgreSQL サービス開始（Ubuntu）
sudo systemctl start postgresql

# データベースとユーザーの作成
sudo -u postgres psql

CREATE DATABASE code_architect_ai;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE code_architect_ai TO your_username;
\q
```

#### オプション B: Neon Database（推奨）
```bash
# Neon CLI インストール
npm install -g @neondatabase/cli

# Neonアカウントでログイン
neonctl auth

# 新しいプロジェクト作成
neonctl projects create --name code-architect-ai

# データベース作成
neonctl databases create --name main

# 接続文字列を取得して .env に設定
neonctl connection-string
```

#### オプション C: Docker Compose
```yaml
# docker-compose.yml を作成
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: code_architect_ai
      POSTGRES_USER: your_username
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Docker Compose でデータベースを起動
docker-compose up -d postgres
```

### 5. データベーススキーマの初期化
```bash
# データベーススキーマを適用
npm run db:push

# 初期データを投入（オプション）
npm run db:seed
```

### 6. 開発サーバーの起動
```bash
# 開発サーバーを開始
npm run dev

# ブラウザで以下にアクセス
# http://localhost:5000
```

## OpenAI API キーの取得

### 1. OpenAI アカウント作成
1. https://platform.openai.com/ にアクセス
2. 「Sign Up」をクリックして新規登録
3. メールアドレスの確認を完了

### 2. API キー生成
1. ダッシュボードにログイン
2. 左サイドバーから「API keys」を選択
3. 「Create new secret key」をクリック
4. キー名を入力（例：Code Architect AI）
5. 「Create secret key」をクリック
6. 表示されたキーをコピーして `.env` ファイルに貼り付け

### 3. 利用制限の設定（推奨）
1. 「Usage」ページで使用量を確認
2. 「Billing」で請求設定を構成
3. 「Rate limits」で制限を設定

## 設定の確認

### 1. 動作確認
```bash
# ヘルスチェック
curl http://localhost:5000/api/health

# 期待される応答:
# {"status":"OK","timestamp":"2024-01-01T00:00:00.000Z","uptime":123.456}
```

### 2. データベース接続確認
```bash
# データベース接続テスト
npm run db:check

# 成功時の出力:
# ✅ Database connection successful
# ✅ All tables exist
```

### 3. OpenAI API 確認
```bash
# API テスト（開発環境のみ）
curl -X POST http://localhost:5000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## トラブルシューティング

### よくある問題

#### Node.js バージョンエラー
```bash
# 現在のバージョンを確認
node --version

# Node.js 18 以上が必要
# nvm を使用してバージョン管理（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### パッケージインストールエラー
```bash
# node_modules とロックファイルを削除
rm -rf node_modules package-lock.json

# 再インストール
npm install

# または npm キャッシュをクリア
npm cache clean --force
```

#### データベース接続エラー
```bash
# PostgreSQL が起動しているか確認
# macOS
brew services list | grep postgresql

# Ubuntu
sudo systemctl status postgresql

# 接続文字列の確認
echo $DATABASE_URL
```

#### ポートが使用中エラー
```bash
# 使用中のプロセスを確認
lsof -i :5000

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
PORT=3000 npm run dev
```

#### OpenAI API エラー
```bash
# API キーの確認
echo $OPENAI_API_KEY

# API キーの形式確認（sk-で始まる必要がある）
# 使用制限や課金設定を OpenAI ダッシュボードで確認
```

## 開発環境の最適化

### 1. エディタ設定（VS Code）
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 2. 推奨拡張機能
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Thunder Client（API テスト用）

### 3. Git フック設定
```bash
# Husky インストール
npm install --save-dev husky

# Git フック設定
npx husky install

# コミット前チェック設定
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

## パフォーマンス向上

### 1. 開発用 RAM ディスク（macOS）
```bash
# 1GB の RAM ディスクを作成
diskutil erasevolume HFS+ "RAMDisk" `hdiutil attach -nomount ram://2097152`

# node_modules を RAM ディスクに移動
mv node_modules /Volumes/RAMDisk/
ln -s /Volumes/RAMDisk/node_modules ./node_modules
```

### 2. SSD 最適化（Linux）
```bash
# SSD 最適化設定
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

## セキュリティ設定

### 1. ファイアウォール設定
```bash
# Ubuntu の場合
sudo ufw allow 5000/tcp

# macOS の場合（システム環境設定で設定）
```

### 2. 開発用 SSL 証明書（オプション）
```bash
# mkcert インストール
brew install mkcert  # macOS
# sudo apt install mkcert  # Ubuntu

# ローカル CA 作成
mkcert -install

# 証明書生成
mkcert localhost 127.0.0.1 ::1
```

## バックアップとバージョン管理

### 1. 開発データのバックアップ
```bash
# データベースダンプ作成
pg_dump code_architect_ai > backup_$(date +%Y%m%d).sql

# 設定ファイルのバックアップ
cp .env .env.backup
```

### 2. Git 設定
```bash
# グローバル設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# プロジェクト固有の設定
git config user.name "Project Name"
git config user.email "project@example.com"
```

---

*インストールに関する質問やサポートが必要な場合は、開発チームまでお気軽にご連絡ください。*