/**
 * NanoGPT Image Provider
 *
 * Implementation of ImageProvider for NanoGPT's image generation API.
 * API Documentation: https://nano-gpt.com/docs
 */

import type {
  ImageProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageModelInfo,
} from './base';
import { ImageGenerationError } from './base';
import { createLogger } from '../../core/config';

const NANOGPT_BASE_URL = 'https://nano-gpt.com';
const NANOGPT_API_V1 = `${NANOGPT_BASE_URL}/api/v1`;
const NANOGPT_IMAGES_ENDPOINT = `${NANOGPT_BASE_URL}/v1/images/generations`;
const NANOGPT_MODELS_ENDPOINT = `${NANOGPT_BASE_URL}/api/models`;

// Fallback model if API doesn't return models
const FALLBACK_MODEL = 'z-image-turbo';

export class NanoGPTImageProvider implements ImageProvider {
  id = 'nanogpt';
  name = 'NanoGPT';

  // Cache for models list (avoid repeated API calls across instances)
  private static modelsCache: ImageModelInfo[] | null = null;
  private static modelsCacheTime = 0;
  private static readonly MODELS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  private apiKey: string;
  private debug: boolean;
  private log = createLogger('NanoGPT');

  constructor(apiKey: string, debug = false) {
    this.apiKey = apiKey;
    this.debug = debug;
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (this.debug) {
      console.log('[NanoGPT] Generating image with request:', {
        model: request.model,
        size: request.size,
        n: request.n,
        promptLength: request.prompt.length,
        hasReferenceImages: !!request.imageDataUrls?.length,
      });
    }

    const body: Record<string, unknown> = {
      prompt: request.prompt,
      model: request.model || FALLBACK_MODEL,
      n: request.n ?? 1,
      size: request.size ?? '1024x1024',
      response_format: request.response_format ?? 'b64_json',
    };

    // Add reference images if provided (for image-to-image generation with qwen-image model)
    if (request.imageDataUrls && request.imageDataUrls.length > 0) {
      body.imageDataUrls = request.imageDataUrls;
    }

    try {
      const response = await fetch(NANOGPT_IMAGES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new ImageGenerationError(
          `NanoGPT image generation failed: ${response.status} ${response.statusText} - ${errorText}`,
          this.id,
          response.status
        );
      }

      const data = await response.json();

      if (this.debug) {
        console.log('[NanoGPT] Generation response:', {
          imageCount: data.data?.length ?? 0,
          cost: data.cost,
          remainingBalance: data.remainingBalance,
        });
      }

      return {
        images: (data.data || []).map((img: any) => ({
          b64_json: img.b64_json,
          url: img.url,
          revised_prompt: img.revised_prompt,
        })),
        model: request.model || FALLBACK_MODEL,
        cost: data.cost,
        remainingBalance: data.remainingBalance,
      };
    } catch (error) {
      if (error instanceof ImageGenerationError) {
        throw error;
      }
      throw new ImageGenerationError(
        `NanoGPT request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        undefined,
        error
      );
    }
  }

  async listModels(): Promise<ImageModelInfo[]> {
    // Return cached models if still valid
    const now = Date.now();
    if (NanoGPTImageProvider.modelsCache && (now - NanoGPTImageProvider.modelsCacheTime) < NanoGPTImageProvider.MODELS_CACHE_TTL) {
      return NanoGPTImageProvider.modelsCache;
    }

    try {
      const response = await fetch(NANOGPT_MODELS_ENDPOINT);

      if (!response.ok) {
        this.log('Failed to fetch models, using fallback');
        return this.getFallbackModels();
      }

      const data = await response.json();

      // NanoGPT returns models at data.models.image (NOT images)
      const imageModels = data?.models?.image || {};

      // Convert object to array (NanoGPT returns object keyed by model ID)
      const modelEntries = Object.values(imageModels) as Array<{
        name?: string;
        model?: string;
        description?: string;
        cost?: Record<string, number>;
        resolutions?: Array<{ value: string; comment?: string }>;
        tags?: string[];
      }>;

      if (modelEntries.length === 0) {
        this.log('No image models found in response, using fallback');
        return this.getFallbackModels();
      }

      const models: ImageModelInfo[] = modelEntries.map((model) => {
        // Extract supported sizes from resolutions
        const supportsSizes = model.resolutions?.map(r => {
          // Convert "1024*1024" format to "1024x1024"
          return r.value.replace('*', 'x');
        }) || ['512x512', '1024x1024'];

        // Check if model supports image-to-image via tags
        const supportsImg2Img = model.tags?.includes('image-to-image') ||
                                model.tags?.includes('image-edit') || false;

        // Calculate average cost from cost object (e.g., { "1024x1024": 0.01, "512x512": 0.005 })
        let costPerImage: number | undefined;
        if (model.cost && typeof model.cost === 'object') {
          const costs = Object.values(model.cost).filter(c => typeof c === 'number');
          if (costs.length > 0) {
            costPerImage = costs.reduce((sum, c) => sum + c, 0) / costs.length;
          }
        }

        return {
          id: model.model || model.name || '',
          name: model.name || model.model || '',
          description: model.description,
          supportsSizes,
          supportsImg2Img,
          costPerImage,
        };
      });

      // Update cache
      NanoGPTImageProvider.modelsCache = models;
      NanoGPTImageProvider.modelsCacheTime = now;

      return models;
    } catch (error) {
      this.log('Error fetching models:', error);
      return this.getFallbackModels();
    }
  }

  /**
   * Clear the models cache to force a fresh fetch
   */
  static clearModelsCache(): void {
    NanoGPTImageProvider.modelsCache = null;
    NanoGPTImageProvider.modelsCacheTime = 0;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Try to list models - if API key is invalid, this should fail
      const response = await fetch(NANOGPT_IMAGES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: 'test',
          model: FALLBACK_MODEL,
          n: 0, // Request 0 images to just validate auth
        }),
      });

      // Even if it fails due to n=0, a 401 means invalid auth
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }

  private getFallbackModels(): ImageModelInfo[] {
    return [
      {
        id: 'z-image-turbo',
        name: 'Image Turbo',
        description: 'Fast, efficient image generation',
        supportsSizes: ['512x512', '1024x1024'],
        supportsImg2Img: false,
      },
      {
        id: 'hidream',
        name: 'HiDream',
        description: 'High quality image generation',
        supportsSizes: ['256x256', '512x512', '1024x1024'],
        supportsImg2Img: false,
      },
      {
        id: 'flux-kontext',
        name: 'Flux Kontext',
        description: 'Context-aware image generation',
        supportsSizes: ['512x512', '1024x1024'],
        supportsImg2Img: true,
      },
    ];
  }
}

/**
 * Create a NanoGPT image provider instance.
 * @param apiKey - The NanoGPT API key
 * @param debug - Enable debug logging
 */
export function createNanoGPTProvider(apiKey: string, debug = false): ImageProvider {
  return new NanoGPTImageProvider(apiKey, debug);
}
