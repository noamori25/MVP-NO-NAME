import { Router, Request, Response } from 'express';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const router = Router();

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { text, image } = req.body;

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
      // For text only, use prompt
      result = await generateText({
        model,
        prompt: text || 'Hello',
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

export default router;

