import type { AIProvider, GenerationRequest, GenerationResponse, StreamChunk, ModelInfo, Message } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider implements AIProvider {
  id = 'openrouter';
  name = 'OpenRouter';

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://aventura.app',
        'X-Title': 'Aventura',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.8,
        max_tokens: request.maxTokens ?? 1024,
        stop: request.stopSequences,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content ?? '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *streamResponse(request: GenerationRequest): AsyncIterable<StreamChunk> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://aventura.app',
        'X-Title': 'Aventura',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.8,
        max_tokens: request.maxTokens ?? 1024,
        stop: request.stopSequences,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content ?? '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name ?? model.id,
      description: model.description,
      contextLength: model.context_length ?? 4096,
      pricing: model.pricing ? {
        prompt: parseFloat(model.pricing.prompt),
        completion: parseFloat(model.pricing.completion),
      } : undefined,
    }));
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}
