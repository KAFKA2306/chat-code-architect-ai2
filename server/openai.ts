import { GoogleGenerativeAI } from "@google/generative-ai";

// the newest Gemini model is "gemini-pro". do not change this unless explicitly requested by the user
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "default_key");

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

export async function generateChatResponse(message: string, context?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `You are Claude Code Architect, a helpful AI assistant specialized in backend development. You help users plan, design, and build backend applications using modern technologies. Be conversational, helpful, and technical when appropriate. Context: ${context || 'General chat about backend development'}` }, { text: message }] }]
    });

    return result.response.text() || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Gemini chat error:', error);
    return "I'm experiencing some technical difficulties. Please try again in a moment.";
  }
}
