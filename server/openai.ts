// AI Integration - supports multiple providers
let genAI: any = null;

// Initialize AI client if API keys are available
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.log("Google Generative AI not available, using fallback mode");
}

export interface CodeGenerationRequest {
  prompt: string;
  techStack?: string[];
  projectType?: string;
  context?: string;
}

export interface CodeGenerationResponse {
  content: string;
  files: Array<{
    filename: string;
    filepath: string;
    content: string;
    fileType: string;
    description?: string;
  }>;
  actions: Array<{
    type: 'pr' | 'deploy' | 'file' | 'migration';
    label: string;
    url?: string;
    description?: string;
  }>;
  status: 'thinking' | 'building' | 'completed' | 'error';
}

export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  try {
    const systemPrompt = `You are Claude Code Architect, an expert backend developer who generates production-ready code. 
    
    Your task is to generate complete, functional backend applications based on user requirements. 
    
    Always respond with JSON in this exact format:
    {
      "content": "Detailed explanation of what you're building",
      "files": [
        {
          "filename": "main.py",
          "filepath": "app/main.py",
          "content": "complete file content",
          "fileType": "py",
          "description": "FastAPI main application file"
        }
      ],
      "actions": [
        {
          "type": "pr",
          "label": "PR #123: Initial setup",
          "description": "Created FastAPI project structure"
        }
      ],
      "status": "completed"
    }
    
    Generate real, working code - no placeholders or TODO comments.
    Include all necessary files: main application, models, routes, config, requirements/package.json, Dockerfile.
    Consider best practices, security, error handling, and scalability.
    
    Tech stack preference: ${request.techStack?.join(', ') || 'FastAPI + PostgreSQL + Docker'}
    Project type: ${request.projectType || 'Backend API'}
    Additional context: ${request.context || 'None'}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }, { text: request.prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const parsedResult = JSON.parse(result.response.text() || '{}');
    
    return {
      content: parsedResult.content || "Code generation completed",
      files: parsedResult.files || [],
      actions: parsedResult.actions || [],
      status: 'completed'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface ChatResponseRequest {
  userMessage: string;
  sessionId: number;
  projectContext?: any;
}

export interface ChatResponseResult {
  content: string;
  metadata?: any;
}

export async function generateChatResponse(request: ChatResponseRequest): Promise<ChatResponseResult> {
  try {
    const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
    
    if (!hasApiKey || !genAI) {
      return {
        content: `こんにちは！Code Architect AIです。

現在、AI APIキーが設定されていないため、デモモードで動作しています。

あなたのメッセージ: "${request.userMessage}"

実際の機能を使用するには、以下のAPIキーのいずれかを設定してください：
- OPENAI_API_KEY (OpenAI GPT-4o用)
- GEMINI_API_KEY (Google Gemini用)

APIキーを設定すると、以下の機能が利用できます：
- 自然言語でのバックエンドアプリケーション設計
- コード自動生成
- プロジェクト構造の提案
- 技術スタックの推奨

何かご質問がございましたら、お気軽にお聞きください！`,
        metadata: {
          sessionId: request.sessionId,
          demoMode: true,
          hasProjectContext: !!request.projectContext,
          timestamp: new Date().toISOString()
        }
      };
    }

    const contextInfo = request.projectContext 
      ? `Current project: ${request.projectContext.name} - ${request.projectContext.description || 'No description'}\nTech stack: ${request.projectContext.techStack?.join(', ') || 'Not specified'}`
      : 'Starting new conversation about backend development';

    const systemPrompt = `あなたはCode Architect AI、バックエンド開発の専門家です。ユーザーが自然言語でバックエンドアプリケーションを設計・構築できるよう支援します。

以下の場合にコード生成を提案してください：
- ユーザーが具体的なアプリケーションの作成を依頼した場合
- API、データベース、認証システムなどの実装を求められた場合
- 既存プロジェクトに新機能の追加を依頼された場合

会話の文脈: ${contextInfo}

フレンドリーで技術的に正確な回答をし、必要に応じてコード生成の提案をしてください。`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [
          { text: systemPrompt }, 
          { text: request.userMessage }
        ] 
      }]
    });

    const responseText = result.response.text() || "申し訳ございませんが、応答を生成できませんでした。もう一度お試しください。";
    
    return {
      content: responseText,
      metadata: {
        sessionId: request.sessionId,
        hasProjectContext: !!request.projectContext,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('AI chat response error:', error);
    
    return {
      content: `申し訳ございません。現在AIサービスに接続できません。

あなたのメッセージ: "${request.userMessage}"

一時的な問題の可能性があります。以下をお試しください：
1. 少し待ってから再度メッセージを送信
2. API キーの確認（OPENAI_API_KEY または GEMINI_API_KEY）
3. ネットワーク接続の確認

技術的な問題が続く場合は、開発者にお問い合わせください。`,
      metadata: {
        error: true,
        sessionId: request.sessionId,
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Legacy function for backward compatibility
export async function generateChatResponseLegacy(message: string, context?: string): Promise<string> {
  try {
    const response = await generateChatResponse({
      userMessage: message,
      sessionId: 0,
      projectContext: context ? { description: context } : undefined
    });
    return response.content;
  } catch (error) {
    console.error('Legacy chat error:', error);
    return "技術的な問題が発生しています。しばらく待ってから再度お試しください。";
  }
}
