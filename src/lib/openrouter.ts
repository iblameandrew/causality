import OpenAI from 'openai';

let client: OpenAI | null = null;

export function initOpenRouter(apiKey: string): OpenAI {
  client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  return client;
}

export function getClient(): OpenAI {
  if (!client) throw new Error('OpenRouter client not initialized. Set your API key first.');
  return client;
}

export async function chatCompletion(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const c = getClient();
  const response = await c.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.85,
    response_format: { type: 'json_object' },
  });
  return response.choices[0]?.message?.content ?? '{}';
}