import { settings } from '$lib/stores/settings.svelte';
import { OpenRouterProvider } from './openrouter';
import type { Message } from './types';
import type { StoryMode, POV, Character, Location, Item } from '$lib/types';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[ScenarioService]', ...args);
  }
}

// Default model for scenario generation - fast and capable
export const SCENARIO_MODEL = 'deepseek/deepseek-chat-v3-0324';

export type Genre = 'fantasy' | 'scifi' | 'modern' | 'horror' | 'mystery' | 'romance' | 'custom';
export type Tense = 'past' | 'present';

export interface WizardData {
  mode: StoryMode;
  genre: Genre;
  customGenre?: string;
  settingSeed: string;
  expandedSetting?: ExpandedSetting;
  protagonist?: GeneratedProtagonist;
  characters?: GeneratedCharacter[];
  writingStyle: {
    pov: POV;
    tense: Tense;
    tone: string;
  };
  title: string;
}

export interface ExpandedSetting {
  name: string;
  description: string;
  keyLocations: {
    name: string;
    description: string;
  }[];
  atmosphere: string;
  themes: string[];
  potentialConflicts: string[];
}

export interface GeneratedProtagonist {
  name: string;
  description: string;
  background: string;
  motivation: string;
  traits: string[];
  appearance?: string;
}

export interface GeneratedCharacter {
  name: string;
  role: string;
  description: string;
  relationship: string;
  traits: string[];
}

export interface GeneratedOpening {
  scene: string;
  title: string;
  initialLocation: {
    name: string;
    description: string;
  };
}

class ScenarioService {
  private getProvider() {
    const apiKey = settings.apiSettings.openrouterApiKey;
    if (!apiKey) {
      throw new Error('No API key configured');
    }
    return new OpenRouterProvider(apiKey);
  }

  /**
   * Expand a user's seed prompt into a full setting description.
   */
  async expandSetting(
    seed: string,
    genre: Genre,
    customGenre?: string
  ): Promise<ExpandedSetting> {
    log('expandSetting called', { seed, genre });

    const provider = this.getProvider();
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a world-building expert creating settings for interactive fiction. Generate rich, evocative settings that inspire creative storytelling.

You MUST respond with valid JSON matching this exact schema:
{
  "name": "string - a memorable name for this setting/world",
  "description": "string - 2-3 paragraphs describing the world, its rules, and atmosphere",
  "keyLocations": [
    { "name": "string", "description": "string - 1-2 sentences" }
  ],
  "atmosphere": "string - the overall mood and feeling of this world",
  "themes": ["string array - 3-5 themes this setting explores"],
  "potentialConflicts": ["string array - 3-5 story hooks or conflicts"]
}

Be creative but grounded. Make the setting feel lived-in and full of story potential.`
      },
      {
        role: 'user',
        content: `Create a ${genreLabel} setting based on this seed idea:

"${seed}"

Expand this into a rich, detailed world suitable for interactive storytelling.`
      }
    ];

    const response = await provider.generateResponse({
      messages,
      model: SCENARIO_MODEL,
      temperature: 0.8,
      maxTokens: 1500,
    });

    log('Setting expansion response received', { length: response.content.length });

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr) as ExpandedSetting;
      log('Setting parsed successfully', { name: result.name });
      return result;
    } catch (error) {
      log('Failed to parse setting response', error);
      // Return a fallback based on the seed
      return {
        name: 'Unnamed World',
        description: seed,
        keyLocations: [{ name: 'Starting Location', description: 'Where the story begins.' }],
        atmosphere: 'Mysterious and full of potential.',
        themes: ['Adventure', 'Discovery'],
        potentialConflicts: ['Unknown dangers lurk ahead.'],
      };
    }
  }

  /**
   * Generate a protagonist character based on the setting and mode.
   */
  async generateProtagonist(
    setting: ExpandedSetting,
    genre: Genre,
    mode: StoryMode,
    pov: POV,
    customGenre?: string
  ): Promise<GeneratedProtagonist> {
    log('generateProtagonist called', { settingName: setting.name, genre, mode, pov });

    const provider = this.getProvider();
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;

    const povContext = pov === 'first'
      ? 'The reader will be this character, narrated in first person (I...).'
      : pov === 'second'
        ? 'The reader will be this character, narrated in second person (You...).'
        : 'This is the main viewpoint character for a third person narrative.';

    const modeContext = mode === 'adventure'
      ? 'This is for an interactive adventure where the reader makes choices as this character.'
      : 'This is for a creative writing project where this character drives the narrative.';

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a character creation expert for interactive fiction. Create compelling protagonists that readers will want to embody or follow.

${povContext}
${modeContext}

You MUST respond with valid JSON matching this exact schema:
{
  "name": "string - a fitting name for this character (or leave generic if POV is second person)",
  "description": "string - 1-2 sentences about who they are",
  "background": "string - 2-3 sentences about their history",
  "motivation": "string - what drives them, what they want",
  "traits": ["string array - 3-5 personality traits"],
  "appearance": "string - brief physical description (optional for 2nd person)"
}

Create a protagonist that fits naturally into the setting and has interesting story potential.`
      },
      {
        role: 'user',
        content: `Create a protagonist for this ${genreLabel} setting:

SETTING: ${setting.name}
${setting.description}

ATMOSPHERE: ${setting.atmosphere}

THEMES: ${setting.themes.join(', ')}

Generate a compelling protagonist who would fit naturally into this world.`
      }
    ];

    const response = await provider.generateResponse({
      messages,
      model: SCENARIO_MODEL,
      temperature: 0.85,
      maxTokens: 800,
    });

    log('Protagonist response received', { length: response.content.length });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr) as GeneratedProtagonist;
      log('Protagonist parsed successfully', { name: result.name });
      return result;
    } catch (error) {
      log('Failed to parse protagonist response', error);
      return {
        name: pov === 'second' ? 'You' : 'The Protagonist',
        description: 'A wanderer seeking adventure.',
        background: 'Your past is your own to reveal.',
        motivation: 'To uncover the truth and find your purpose.',
        traits: ['Curious', 'Determined', 'Resourceful'],
      };
    }
  }

  /**
   * Generate supporting characters for creative writing mode.
   */
  async generateCharacters(
    setting: ExpandedSetting,
    protagonist: GeneratedProtagonist,
    genre: Genre,
    count: number = 3,
    customGenre?: string
  ): Promise<GeneratedCharacter[]> {
    log('generateCharacters called', { settingName: setting.name, count });

    const provider = this.getProvider();
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a character creation expert. Create compelling supporting characters that complement the protagonist and drive story conflict.

You MUST respond with valid JSON: an array of character objects:
[
  {
    "name": "string",
    "role": "string - their role in the story (ally, antagonist, mentor, love interest, etc.)",
    "description": "string - 1-2 sentences about who they are",
    "relationship": "string - their relationship to the protagonist",
    "traits": ["string array - 2-4 personality traits"]
  }
]

Create diverse characters with different roles and personalities.`
      },
      {
        role: 'user',
        content: `Create ${count} supporting characters for this ${genreLabel} story:

SETTING: ${setting.name}
${setting.description}

PROTAGONIST: ${protagonist.name}
${protagonist.description}
Motivation: ${protagonist.motivation}

Generate ${count} interesting supporting characters who would create compelling dynamics with the protagonist.`
      }
    ];

    const response = await provider.generateResponse({
      messages,
      model: SCENARIO_MODEL,
      temperature: 0.85,
      maxTokens: 1200,
    });

    log('Characters response received', { length: response.content.length });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr) as GeneratedCharacter[];
      log('Characters parsed successfully', { count: result.length });
      return result;
    } catch (error) {
      log('Failed to parse characters response', error);
      return [];
    }
  }

  /**
   * Generate an opening scene based on all the setup data.
   */
  async generateOpening(
    wizardData: WizardData
  ): Promise<GeneratedOpening> {
    log('generateOpening called', {
      settingName: wizardData.expandedSetting?.name,
      protagonist: wizardData.protagonist?.name,
      mode: wizardData.mode,
    });

    const provider = this.getProvider();
    const { mode, genre, customGenre, expandedSetting, protagonist, characters, writingStyle, title } = wizardData;
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;
    const userName = protagonist?.name || 'the protagonist';

    // Build POV instruction
    let povInstruction = '';
    switch (writingStyle.pov) {
      case 'first':
        povInstruction = `Write in first person from ${userName}'s perspective ("I see...", "I feel...").`;
        break;
      case 'second':
        povInstruction = `Write in second person, addressing ${userName} as "you" ("You see...", "You feel...").`;
        break;
      case 'third':
        povInstruction = `Write in third person, following ${userName} ("${userName} sees...", "${userName} feels...").`;
        break;
    }

    const tenseInstruction = writingStyle.tense === 'present'
      ? 'Use present tense.'
      : 'Use past tense.';

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a master storyteller crafting the opening scene of an interactive ${genreLabel} ${mode === 'adventure' ? 'adventure' : 'story'}.

<critical_constraints>
# HARD RULES (Absolute Priority)
1. **NEVER write dialogue, actions, decisions, or internal thoughts for ${userName}**
2. **You control NPCs, environment, and plot—never ${userName}'s character**
3. **End with a natural opening for ${userName} to act or respond—NOT a question, but a situation that invites action**
4. **Write 3-4 paragraphs of evocative prose**
</critical_constraints>

<writing_style>
- ${povInstruction}
- ${tenseInstruction}
- Tone: ${writingStyle.tone || 'immersive and engaging'}
- Anchor every scene in concrete physical detail—sights, sounds, textures, smells
- Avoid abstract emotion words without physical correlatives (not "felt nervous" but show the physical symptom)
- Vary sentence rhythm: fragments for impact, longer clauses when moments need weight
</writing_style>

<ending_instruction>
End the scene with ${userName} in a moment of potential action—an NPC waiting for response, a door that could be opened, a sound that demands investigation, an object within reach. The ending should be a **pregnant pause**, not a question. Create narrative tension that naturally invites ${userName}'s next move without explicitly asking "What do you do?"
</ending_instruction>

<forbidden_patterns>
- Writing any actions, dialogue, or thoughts for ${userName}
- Ending with a direct question to ${userName}
- Melodramatic phrases: hearts shattering, waves of emotion, breath catching
- Summarizing what ${userName} thinks or feels
- Resolving tension—leave it hanging for ${userName} to engage with
</forbidden_patterns>

You MUST respond with valid JSON matching this schema:
{
  "scene": "string - the opening narrative (3-4 paragraphs of prose)",
  "title": "string - a suggested story title if none provided, or confirm the given title",
  "initialLocation": {
    "name": "string - where the story begins",
    "description": "string - 1-2 sentences describing this location"
  }
}`
      },
      {
        role: 'user',
        content: `Create the opening scene for this story:

TITLE: ${title || '(suggest one)'}

SETTING: ${expandedSetting?.name || 'Unknown World'}
${expandedSetting?.description || wizardData.settingSeed}

ATMOSPHERE: ${expandedSetting?.atmosphere || 'mysterious'}

PROTAGONIST (${userName}):
${protagonist?.description || 'An adventurer about to begin their journey.'}
${protagonist?.background ? `Background: ${protagonist.background}` : ''}
${protagonist?.motivation ? `Motivation: ${protagonist.motivation}` : ''}

${characters && characters.length > 0 ? `
SUPPORTING CHARACTERS (may or may not appear in opening):
${characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')}
` : ''}

Write an engaging opening scene that:
1. Establishes the world through sensory detail
2. Places ${userName} in an interesting situation
3. Ends with a natural opening for ${userName} to take action (NOT a question)`
      }
    ];

    const response = await provider.generateResponse({
      messages,
      model: SCENARIO_MODEL,
      temperature: 0.85,
      maxTokens: 1500,
    });

    log('Opening response received', { length: response.content.length });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr) as GeneratedOpening;
      log('Opening parsed successfully', { title: result.title });
      return result;
    } catch (error) {
      log('Failed to parse opening response', error);
      // Fallback: use the raw response as the scene
      return {
        scene: response.content,
        title: title || 'Untitled Adventure',
        initialLocation: {
          name: expandedSetting?.keyLocations?.[0]?.name || 'Starting Location',
          description: expandedSetting?.keyLocations?.[0]?.description || 'Where the story begins.',
        },
      };
    }
  }

  /**
   * Stream the opening scene generation for real-time display.
   */
  async *streamOpening(
    wizardData: WizardData
  ): AsyncIterable<{ content: string; done: boolean }> {
    log('streamOpening called');

    const provider = this.getProvider();
    const { mode, genre, customGenre, expandedSetting, protagonist, characters, writingStyle, title } = wizardData;
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;
    const userName = protagonist?.name || 'the protagonist';

    // Build POV instruction
    let povInstruction = '';
    switch (writingStyle.pov) {
      case 'first':
        povInstruction = `Write in first person from ${userName}'s perspective ("I see...", "I feel...").`;
        break;
      case 'second':
        povInstruction = `Write in second person, addressing ${userName} as "you" ("You see...", "You feel...").`;
        break;
      case 'third':
        povInstruction = `Write in third person, following ${userName} ("${userName} sees...", "${userName} feels...").`;
        break;
    }

    const tenseInstruction = writingStyle.tense === 'present'
      ? 'Use present tense.'
      : 'Use past tense.';

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a master storyteller crafting the opening scene of an interactive ${genreLabel} ${mode === 'adventure' ? 'adventure' : 'story'}.

<critical_constraints>
# HARD RULES
1. **NEVER write dialogue, actions, decisions, or internal thoughts for ${userName}**
2. **You control NPCs, environment, and plot—never ${userName}'s character**
3. **End with a natural opening for ${userName} to act—NOT a question**
</critical_constraints>

<writing_style>
- ${povInstruction}
- ${tenseInstruction}
- Tone: ${writingStyle.tone || 'immersive and engaging'}
- Anchor scenes in concrete physical detail
- Vary sentence rhythm for impact
</writing_style>

<ending_instruction>
End with ${userName} in a moment of potential action—a situation that naturally invites their next move without asking "What do you do?"
</ending_instruction>

Write ONLY the prose narrative. No JSON, no metadata, just the story opening (3-4 paragraphs).`
      },
      {
        role: 'user',
        content: `Write the opening scene:

SETTING: ${expandedSetting?.name || 'Unknown World'}
${expandedSetting?.description || wizardData.settingSeed}

PROTAGONIST (${userName}):
${protagonist?.description || 'An adventurer about to begin their journey.'}

Write an evocative opening that places ${userName} in an interesting situation, ending with a natural opening for them to act.`
      }
    ];

    for await (const chunk of provider.streamResponse({
      messages,
      model: SCENARIO_MODEL,
      temperature: 0.85,
      maxTokens: 1000,
    })) {
      yield chunk;
    }
  }

  /**
   * Convert wizard data to story creation parameters.
   */
  prepareStoryData(wizardData: WizardData, opening: GeneratedOpening): {
    title: string;
    genre: string;
    mode: StoryMode;
    settings: { pov: POV };
    protagonist: Partial<Character>;
    startingLocation: Partial<Location>;
    initialItems: Partial<Item>[];
    openingScene: string;
    systemPrompt: string;
    characters: Partial<Character>[];
  } {
    const { mode, genre, customGenre, expandedSetting, protagonist, characters, writingStyle } = wizardData;
    const genreLabel = genre === 'custom' && customGenre ? customGenre : this.capitalizeGenre(genre);

    // Build a custom system prompt based on the setting
    const systemPrompt = this.buildSystemPrompt(wizardData, expandedSetting);

    return {
      title: opening.title || wizardData.title,
      genre: genreLabel,
      mode,
      settings: { pov: writingStyle.pov },
      protagonist: {
        name: protagonist?.name || (writingStyle.pov === 'second' ? 'You' : 'The Protagonist'),
        description: protagonist?.description,
        relationship: 'self',
        traits: protagonist?.traits || [],
        status: 'active',
      },
      startingLocation: {
        name: opening.initialLocation.name,
        description: opening.initialLocation.description,
        visited: true,
        current: true,
        connections: [],
      },
      initialItems: [],
      openingScene: opening.scene,
      systemPrompt,
      characters: (characters || []).map(c => ({
        name: c.name,
        description: c.description,
        relationship: c.relationship,
        traits: c.traits,
        status: 'active' as const,
      })),
    };
  }

  private buildSystemPrompt(wizardData: WizardData, setting?: ExpandedSetting): string {
    const { mode, genre, customGenre, writingStyle, protagonist } = wizardData;
    const genreLabel = genre === 'custom' && customGenre ? customGenre : genre;
    const userName = protagonist?.name || 'the protagonist';

    let povInstruction = '';
    switch (writingStyle.pov) {
      case 'first':
        povInstruction = `Write in first person from ${userName}'s perspective ("I see...", "I feel...").`;
        break;
      case 'second':
        povInstruction = `Write in second person, addressing ${userName} as "you" ("You see...", "You feel...").`;
        break;
      case 'third':
        povInstruction = `Write in third person, following ${userName} ("${userName} sees...", "${userName} feels...").`;
        break;
    }

    const tenseInstruction = writingStyle.tense === 'present'
      ? 'Use present tense.'
      : 'Use past tense.';

    if (mode === 'creative-writing') {
      return `You are a skilled fiction writer co-authoring a ${genreLabel} story with ${userName}'s player. You control all NPCs, environments, and plot progression. You are the narrator—never ${userName}'s character.

<setting>
${setting?.name || 'A unique world'}
${setting?.description || ''}
</setting>

<critical_constraints>
# HARD RULES (Absolute Priority)
1. **NEVER write dialogue, actions, decisions, or internal thoughts for ${userName}**
2. **You control NPCs, environment, and plot—never ${userName}'s character**
3. **End with a natural opening for ${userName} to act or respond—NOT a direct question**
4. **Continue directly from the previous beat—no recaps, no scene-setting preamble**
</critical_constraints>

<prose_architecture>
## Sensory Grounding
Anchor every scene in concrete physical detail. Abstract nouns require physical correlatives.
- Avoid: "felt nervous" → Instead show the physical symptom
- Vary sentence rhythm: fragments for impact, longer clauses when moments need weight

## Dialogue
Characters should rarely answer questions directly. Map each line to:
- What is said (text)
- What is meant (subtext)
- What the body does (status transaction)

## Style
- ${povInstruction}
- ${tenseInstruction}
- Tone: ${writingStyle.tone || 'engaging and immersive'}
- Write 2-4 paragraphs per response
- Balance action, dialogue, and description
</prose_architecture>

<themes>
${setting?.themes?.map(t => `- ${t}`).join('\n') || '- Adventure and discovery'}
</themes>

<ending_instruction>
End each response with ${userName} in a moment of potential action—an NPC waiting for response, a door that could be opened, a sound that demands investigation. Create a **pregnant pause** that naturally invites ${userName}'s next move without explicitly asking what they do.
</ending_instruction>

<forbidden_patterns>
- Writing any actions, dialogue, or thoughts for ${userName}
- Ending with a direct question to ${userName}
- Melodramatic phrases: hearts shattering, waves of emotion, breath catching
- Summarizing what ${userName} thinks or feels
- Echo phrasing: restating what ${userName} just wrote
- Breaking the narrative voice or referencing being an AI
</forbidden_patterns>`;
    } else {
      return `You are the narrator of an interactive ${genreLabel} adventure with ${userName}. You control all NPCs, environments, and plot progression. You are the narrator—never ${userName}'s character.

<setting>
${setting?.name || 'A world of adventure'}
${setting?.description || ''}
</setting>

<critical_constraints>
# HARD RULES (Absolute Priority)
1. **NEVER write dialogue, actions, decisions, or internal thoughts for ${userName}**
2. **You control NPCs, environment, and plot—never ${userName}'s character**
3. **End with a natural opening for ${userName} to act—NOT a direct question like "What do you do?"**
4. **Continue directly from the previous beat—no recaps**
</critical_constraints>

<prose_architecture>
## Sensory Grounding
Anchor every scene in concrete physical detail—sights, sounds, textures, smells.
- Avoid abstract emotion words without physical correlatives
- Not "felt nervous" → show the symptom: fidgeting hands, dry throat

## Dialogue
NPCs should feel like real people with their own agendas.
- Characters deflect, interrupt, talk past each other
- Power dynamics shift spatially—who claims space, who shrinks

## Style
- ${povInstruction}
- ${tenseInstruction}
- Tone: ${writingStyle.tone || 'immersive and engaging'}
- Write 2-4 paragraphs per response
- Vary sentence rhythm for impact
</prose_architecture>

<themes>
${setting?.themes?.map(t => `- ${t}`).join('\n') || '- Adventure and discovery'}
</themes>

<narrative_principles>
- Respond to ${userName}'s actions naturally and logically within the world
- Honor ${userName}'s agency—describe results of their choices, don't override them
- Introduce interesting characters, challenges, and opportunities organically
- Maintain strict consistency with established world details
</narrative_principles>

<ending_instruction>
End each response with ${userName} in a moment of potential action—an NPC waiting, a sound in the darkness, an object within reach. The ending should be a **pregnant pause** that naturally invites ${userName}'s next move. Never end with "What do you do?" or similar direct questions.
</ending_instruction>

<forbidden_patterns>
- Writing any actions, dialogue, or thoughts for ${userName}
- Ending with direct questions to ${userName}
- Making decisions for ${userName} or assuming their next action
- Melodramatic phrases: hearts shattering, waves of emotion
- Describing what ${userName} thinks or feels unless they implied it
- Breaking character or referencing being an AI
- Repeating information ${userName} already knows
</forbidden_patterns>`;
    }
  }

  private capitalizeGenre(genre: Genre): string {
    const genreMap: Record<Genre, string> = {
      fantasy: 'Fantasy',
      scifi: 'Sci-Fi',
      modern: 'Modern',
      horror: 'Horror',
      mystery: 'Mystery',
      romance: 'Romance',
      custom: 'Custom',
    };
    return genreMap[genre] || genre;
  }
}

export const scenarioService = new ScenarioService();
