import { settings } from '$lib/stores/settings.svelte';
import { OpenRouterProvider } from './openrouter';
import { BUILTIN_TEMPLATES } from '$lib/services/templates';
import type { Message, GenerationResponse, StreamChunk } from './types';
import type { Story, StoryEntry, Character, Location, Item, StoryBeat } from '$lib/types';

interface WorldState {
  characters: Character[];
  locations: Location[];
  items: Item[];
  storyBeats: StoryBeat[];
  currentLocation?: Location;
}

class AIService {
  private getProvider() {
    const apiKey = settings.apiSettings.openrouterApiKey;
    if (!apiKey) {
      throw new Error('No API key configured');
    }
    return new OpenRouterProvider(apiKey);
  }

  async generateResponse(
    entries: StoryEntry[],
    worldState: WorldState,
    story?: Story | null
  ): Promise<string> {
    const provider = this.getProvider();

    // Build the system prompt with world state context
    const systemPrompt = this.buildSystemPrompt(worldState, story?.templateId);

    // Build conversation history
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent entries as conversation history
    const recentEntries = entries.slice(-20); // Keep last 20 entries for context
    for (const entry of recentEntries) {
      if (entry.type === 'user_action') {
        messages.push({ role: 'user', content: entry.content });
      } else if (entry.type === 'narration') {
        messages.push({ role: 'assistant', content: entry.content });
      }
    }

    const response = await provider.generateResponse({
      messages,
      model: settings.apiSettings.defaultModel,
      temperature: settings.apiSettings.temperature,
      maxTokens: settings.apiSettings.maxTokens,
    });

    return response.content;
  }

  async *streamResponse(
    entries: StoryEntry[],
    worldState: WorldState,
    story?: Story | null
  ): AsyncIterable<StreamChunk> {
    const provider = this.getProvider();

    // Build the system prompt with world state context
    const systemPrompt = this.buildSystemPrompt(worldState, story?.templateId);

    // Build conversation history
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent entries as conversation history
    const recentEntries = entries.slice(-20);
    for (const entry of recentEntries) {
      if (entry.type === 'user_action') {
        messages.push({ role: 'user', content: entry.content });
      } else if (entry.type === 'narration') {
        messages.push({ role: 'assistant', content: entry.content });
      }
    }

    yield* provider.streamResponse({
      messages,
      model: settings.apiSettings.defaultModel,
      temperature: settings.apiSettings.temperature,
      maxTokens: settings.apiSettings.maxTokens,
    });
  }

  private buildSystemPrompt(worldState: WorldState, templateId?: string | null): string {
    // Get template-specific system prompt if available
    let basePrompt = '';

    if (templateId) {
      const template = BUILTIN_TEMPLATES.find(t => t.id === templateId);
      if (template?.systemPrompt) {
        basePrompt = template.systemPrompt;
      }
    }

    // If no template prompt, use default
    if (!basePrompt) {
      basePrompt = `You are an expert interactive fiction narrator and game master. Your role is to create engaging, immersive narrative responses to player actions.

## Guidelines:
- Write in second person ("You see...", "You feel...")
- Be descriptive and evocative, using sensory details
- Respond to player actions naturally and logically
- Maintain consistency with established world elements
- Introduce interesting characters, challenges, and plot developments
- Keep responses concise but atmospheric (2-4 paragraphs typically)
- Never break character or mention being an AI`;
    }

    // Add current world state context
    let worldContext = '\n\n---\n\n## Current World State:';
    let hasContext = false;

    // Add current location
    if (worldState.currentLocation) {
      hasContext = true;
      worldContext += `\n\n### Current Location: ${worldState.currentLocation.name}`;
      if (worldState.currentLocation.description) {
        worldContext += `\n${worldState.currentLocation.description}`;
      }
    }

    // Add active characters (excluding self)
    const activeChars = worldState.characters.filter(c => c.status === 'active' && c.relationship !== 'self');
    if (activeChars.length > 0) {
      hasContext = true;
      worldContext += '\n\n### Known Characters:';
      for (const char of activeChars) {
        worldContext += `\n- **${char.name}**`;
        if (char.relationship) worldContext += ` (${char.relationship})`;
        if (char.description) worldContext += `: ${char.description}`;
        if (char.traits && char.traits.length > 0) {
          worldContext += ` [${char.traits.join(', ')}]`;
        }
      }
    }

    // Add inventory
    const inventory = worldState.items.filter(i => i.location === 'inventory');
    if (inventory.length > 0) {
      hasContext = true;
      worldContext += '\n\n### Player Inventory:';
      for (const item of inventory) {
        worldContext += `\n- ${item.name}`;
        if (item.quantity > 1) worldContext += ` (x${item.quantity})`;
        if (item.equipped) worldContext += ' [equipped]';
        if (item.description) worldContext += `: ${item.description}`;
      }
    }

    // Add active quests
    const activeQuests = worldState.storyBeats.filter(b => b.status === 'active' || b.status === 'pending');
    if (activeQuests.length > 0) {
      hasContext = true;
      worldContext += '\n\n### Active Story Threads:';
      for (const quest of activeQuests) {
        worldContext += `\n- **${quest.title}**`;
        if (quest.type) worldContext += ` [${quest.type}]`;
        if (quest.description) worldContext += `: ${quest.description}`;
      }
    }

    // Add visited locations for context
    const visitedLocations = worldState.locations.filter(l => l.visited && !l.current);
    if (visitedLocations.length > 0) {
      hasContext = true;
      worldContext += '\n\n### Previously Visited:';
      worldContext += visitedLocations.map(l => l.name).join(', ');
    }

    // Only add world context if we have any
    if (hasContext) {
      basePrompt += worldContext;
    }

    // Add final instruction
    basePrompt += '\n\n---\n\n**Instructions:** Respond to the player\'s action with an engaging narrative continuation. Describe the results of their action, include sensory details and character reactions, and set up opportunities for further exploration or interaction.';

    return basePrompt;
  }
}

export const aiService = new AIService();
