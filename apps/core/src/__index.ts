import dotenv from 'dotenv';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';

// Load environment variables
dotenv.config();

const main = async () => {

  console.log('sending request to openai');
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    maxTokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'what is the active window on my screen?',
          },
          {
            type: 'image',
            image: fs.readFileSync('./screenshots/screenshot-2025-05-10T15-01-12.311Z_resized.jpg'),
          },
        ],
      },
    ],
  });

  console.log(result.text);
}

main()