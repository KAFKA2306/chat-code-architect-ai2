import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateCode, generateChatResponse } from "./openai";
import { insertChatMessageSchema, insertChatSessionSchema, insertProjectSchema, insertGeneratedFileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          // Handle real-time chat messages
          const response = await generateChatResponse({
            userMessage: message.content,
            sessionId: message.sessionId || 0,
            projectContext: message.context
          });
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat_response',
              content: response.content,
              metadata: response.metadata,
              timestamp: new Date().toISOString()
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // API Routes

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Project routes
  app.get('/api/projects', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid project data', details: error.errors });
      }
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Chat session routes
  app.get('/api/chat-sessions', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Get chat sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.post('/api/chat-sessions', async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid session data', details: error.errors });
      }
      console.error('Create chat session error:', error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  });

  // Chat message routes
  app.get('/api/chat-sessions/:sessionId/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  });

  app.post('/api/chat-sessions/:sessionId/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        sessionId
      });
      
      // Create user message
      const userMessage = await storage.createChatMessage(messageData);
      
      // If it's a user message, generate AI response
      if (messageData.type === 'user') {
        try {
          // Get chat session to understand context
          const session = await storage.getChatSession(sessionId);
          let projectContext = null;
          
          if (session?.projectId) {
            const project = await storage.getProject(session.projectId);
            projectContext = project;
          }
          
          // Generate AI response
          const aiResponse = await generateChatResponse({
            userMessage: messageData.content,
            sessionId,
            projectContext
          });
          
          // Create AI response message
          const aiMessageData = {
            sessionId,
            type: 'assistant' as const,
            content: aiResponse.content,
            metadata: aiResponse.metadata
          };
          
          const aiMessage = await storage.createChatMessage(aiMessageData);
          
          // Return both messages
          res.status(201).json({
            userMessage,
            aiMessage
          });
        } catch (aiError) {
          console.error('AI response generation error:', aiError);
          // Still return the user message even if AI fails
          res.status(201).json({
            userMessage,
            error: 'AI response generation failed'
          });
        }
      } else {
        // For non-user messages, just return the created message
        res.status(201).json({ userMessage });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid message data', details: error.errors });
      }
      console.error('Create chat message error:', error);
      res.status(500).json({ error: 'Failed to create chat message' });
    }
  });

  // Code generation endpoint
  app.post('/api/generate-code', async (req, res) => {
    try {
      const { prompt, techStack, projectType, context, projectId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Generate code using OpenAI
      const result = await generateCode({
        prompt,
        techStack,
        projectType,
        context
      });

      // Save generated files to database if projectId is provided
      if (projectId && result.files) {
        for (const file of result.files) {
          await storage.createGeneratedFile({
            projectId: parseInt(projectId),
            filename: file.filename,
            filepath: file.filepath,
            content: file.content,
            fileType: file.fileType,
          });
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate code',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generated files routes
  app.get('/api/projects/:projectId/files', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = await storage.getGeneratedFilesByProject(projectId);
      res.json(files);
    } catch (error) {
      console.error('Get generated files error:', error);
      res.status(500).json({ error: 'Failed to fetch generated files' });
    }
  });

  app.get('/api/files/:fileId', async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const file = await storage.getGeneratedFile(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.json(file);
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ error: 'Failed to fetch file' });
    }
  });

  // Download project as ZIP
  app.get('/api/projects/:projectId/download', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = await storage.getGeneratedFilesByProject(projectId);
      
      if (files.length === 0) {
        return res.status(404).json({ error: 'No files found for this project' });
      }

      // For now, return file list - in production, you'd create a ZIP file
      res.json({
        message: 'Project download ready',
        files: files.map(f => ({
          filename: f.filename,
          filepath: f.filepath,
          size: f.content.length
        }))
      });
    } catch (error) {
      console.error('Download project error:', error);
      res.status(500).json({ error: 'Failed to prepare project download' });
    }
  });

  return httpServer;
}
