# API リファレンス

## 概要

Code Architect AI のREST API仕様書です。すべてのエンドポイントは`/api`プレフィックスを使用し、JSON形式でデータをやり取りします。

## 認証

現在はセッションベース認証を使用していますが、将来的にはJWT認証への移行を予定しています。

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "data": {...},
  "status": "success"
}
```

### エラーレスポンス
```json
{
  "error": "エラーメッセージ",
  "status": "error",
  "code": "ERROR_CODE"
}
```

## エンドポイント

### プロジェクト管理

#### プロジェクト一覧取得
```http
GET /api/projects?userId={userId}
```

**パラメータ:**
- `userId` (required): ユーザーID

**レスポンス例:**
```json
[
  {
    "id": 1,
    "name": "ブログAPI",
    "description": "ユーザー認証付きブログシステム",
    "userId": 1,
    "status": "completed",
    "techStack": ["Node.js", "PostgreSQL", "JWT"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### プロジェクト作成
```http
POST /api/projects
```

**リクエストボディ:**
```json
{
  "name": "新しいプロジェクト",
  "description": "プロジェクトの説明",
  "userId": 1,
  "techStack": ["Express.js", "MongoDB"]
}
```

**レスポンス例:**
```json
{
  "id": 2,
  "name": "新しいプロジェクト",
  "description": "プロジェクトの説明",
  "userId": 1,
  "status": "planning",
  "techStack": ["Express.js", "MongoDB"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### プロジェクト詳細取得
```http
GET /api/projects/{id}
```

**パラメータ:**
- `id` (required): プロジェクトID

#### プロジェクト更新
```http
PUT /api/projects/{id}
```

**リクエストボディ:**
```json
{
  "name": "更新されたプロジェクト名",
  "description": "更新された説明",
  "status": "building"
}
```

#### プロジェクト削除
```http
DELETE /api/projects/{id}
```

#### プロジェクトファイル一覧
```http
GET /api/projects/{id}/files
```

**レスポンス例:**
```json
[
  {
    "id": 1,
    "projectId": 1,
    "filename": "server.js",
    "content": "const express = require('express');...",
    "language": "javascript",
    "path": "/src/server.js",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### チャット機能

#### チャットセッション一覧
```http
GET /api/chat-sessions?userId={userId}
```

**レスポンス例:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "projectId": 1,
    "title": "ブログAPIの開発",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### チャットセッション作成
```http
POST /api/chat-sessions
```

**リクエストボディ:**
```json
{
  "userId": 1,
  "projectId": 1,
  "title": "新しいチャット"
}
```

#### チャットメッセージ一覧
```http
GET /api/chat-sessions/{sessionId}/messages
```

**レスポンス例:**
```json
[
  {
    "id": 1,
    "sessionId": 1,
    "type": "user",
    "content": "ブログAPIを作ってください",
    "metadata": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "sessionId": 1,
    "type": "assistant",
    "content": "ブログAPIを作成します...",
    "metadata": {
      "generatedFiles": ["server.js", "models/Post.js"],
      "techStack": ["Express.js", "MongoDB"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### メッセージ送信
```http
POST /api/chat-sessions/{sessionId}/messages
```

**リクエストボディ:**
```json
{
  "type": "user",
  "content": "認証機能を追加してください"
}
```

### AI機能

#### コード生成
```http
POST /api/ai/generate-code
```

**リクエストボディ:**
```json
{
  "prompt": "Express.jsでユーザー認証APIを作成",
  "projectContext": {
    "techStack": ["Node.js", "Express.js", "MongoDB"],
    "existingFiles": ["server.js", "package.json"]
  }
}
```

**レスポンス例:**
```json
{
  "generatedFiles": [
    {
      "filename": "auth.js",
      "content": "const express = require('express');\n...",
      "language": "javascript",
      "description": "ユーザー認証ミドルウェア"
    }
  ],
  "explanation": "JWT認証を使用したユーザー認証システムを作成しました...",
  "nextSteps": [
    "環境変数にJWT_SECRETを設定",
    "bcryptでパスワードをハッシュ化"
  ]
}
```

#### プロジェクト分析
```http
POST /api/ai/analyze-project
```

**リクエストボディ:**
```json
{
  "projectId": 1,
  "analysisType": "security" // security, performance, structure
}
```

#### 改善提案
```http
POST /api/ai/suggest-improvements
```

**リクエストボディ:**
```json
{
  "projectId": 1,
  "focusArea": "performance" // performance, security, maintainability
}
```

### 生成ファイル管理

#### ファイル一覧取得
```http
GET /api/generated-files?projectId={projectId}
```

#### ファイル作成
```http
POST /api/generated-files
```

**リクエストボディ:**
```json
{
  "projectId": 1,
  "filename": "middleware/auth.js",
  "content": "const jwt = require('jsonwebtoken');...",
  "language": "javascript",
  "description": "JWT認証ミドルウェア"
}
```

#### ファイル更新
```http
PUT /api/generated-files/{id}
```

#### ファイル削除
```http
DELETE /api/generated-files/{id}
```

## WebSocket API

### 接続
```javascript
const socket = new WebSocket('ws://localhost:5000/ws');
```

### イベント

#### チャットメッセージ
```json
{
  "type": "chat_message",
  "payload": {
    "sessionId": 1,
    "content": "新しいメッセージ",
    "type": "user"
  }
}
```

#### コード生成開始
```json
{
  "type": "code_generation_start",
  "payload": {
    "sessionId": 1,
    "projectId": 1
  }
}
```

#### コード生成完了
```json
{
  "type": "code_generation_complete",
  "payload": {
    "sessionId": 1,
    "generatedFiles": [...],
    "explanation": "..."
  }
}
```

#### プロジェクト状態更新
```json
{
  "type": "project_status_update",
  "payload": {
    "projectId": 1,
    "status": "building",
    "progress": 75
  }
}
```

## エラーコード

| コード | 説明 |
|--------|------|
| `USER_NOT_FOUND` | ユーザーが見つかりません |
| `PROJECT_NOT_FOUND` | プロジェクトが見つかりません |
| `SESSION_NOT_FOUND` | チャットセッションが見つかりません |
| `INVALID_INPUT` | 入力データが無効です |
| `UNAUTHORIZED` | 認証が必要です |
| `FORBIDDEN` | アクセス権限がありません |
| `AI_SERVICE_ERROR` | AI サービスエラー |
| `DATABASE_ERROR` | データベースエラー |

## レート制限

- API呼び出し: 1分間に60リクエスト
- コード生成: 1分間に10リクエスト
- WebSocket接続: 同時に5接続まで

## 使用例

### JavaScript/TypeScript
```javascript
// プロジェクト一覧取得
const response = await fetch('/api/projects?userId=1');
const projects = await response.json();

// 新しいプロジェクト作成
const newProject = {
  name: 'マイプロジェクト',
  description: 'テストプロジェクト',
  userId: 1,
  techStack: ['Node.js', 'Express.js']
};

const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newProject)
});
```

### curl
```bash
# プロジェクト一覧取得
curl -X GET "http://localhost:5000/api/projects?userId=1"

# 新しいプロジェクト作成
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"テストプロジェクト","userId":1}'
```

---

*APIに関する質問やフィードバックは、開発チームまでお気軽にお問い合わせください。*