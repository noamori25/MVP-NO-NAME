import { Router, Request, Response } from 'express';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { AiRules } from '../AiRules.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { text, image, history } = req.body;

    if (!text && !image) {
      return res.status(400).json({ error: 'Text or image is required' });
    }

    // Support both GEMINI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Set the API key in environment for @ai-sdk/google to use
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    const model = google('gemini-2.5-flash');

    // Build the prompt or messages based on input
    let result;

    if (image) {
      // For images, use messages format with proper content structure
      console.log('Processing request with image, image length:', image.length);

      // Build content array with proper types
      const contentParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

      // Add text if provided
      if (text) {
        contentParts.push({ type: 'text', text });
      }

      // Add image (data URL format - Vercel AI SDK expects full data URL)
      contentParts.push({ type: 'image', image: image });

      const messages = [
        {
          role: 'user' as const,
          content: contentParts,
        },
      ];

      console.log('Sending to Gemini with messages (first 500 chars):', JSON.stringify(messages, null, 2).substring(0, 500));

      result = await generateText({
        model,
        messages: messages as any, // Type assertion needed due to SDK type definitions
      });
    } else {
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      if (history && Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-4, -1);
        for (const msg of recentHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content || '',
            });
          }
        }
      }
      messages.push({
        role: 'user',
        content: text || 'Hello',
      });




      result = await generateText({
        model,
        system: AiRules.system,
        messages: messages as any,
      });
    }

    res.json({ response: result.text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET endpoint to read current AiRules.ts file content
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rulesFilePath = path.join(__dirname, '..', 'AiRules.ts');
    const fileContent = await fs.readFile(rulesFilePath, 'utf-8');
    res.json({ content: fileContent });
  } catch (error) {
    console.error('Error reading AiRules.ts:', error);
    res.status(500).json({
      error: 'Failed to read rules file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST endpoint to save new content to AiRules.ts file
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    const rulesFilePath = path.join(__dirname, '..', 'AiRules.ts');
    await fs.writeFile(rulesFilePath, content, 'utf-8');

    res.json({
      success: true,
      message: 'File saved successfully! Please restart the server with \'yarn dev\' to apply changes.'
    });
  } catch (error) {
    console.error('Error writing to AiRules.ts:', error);
    res.status(500).json({
      error: 'Failed to save rules file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

