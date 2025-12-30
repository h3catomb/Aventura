import type { Story, StoryEntry, Character, Location, Item, StoryBeat } from '$lib/types';
import { database } from '$lib/services/database';
import { BUILTIN_TEMPLATES } from '$lib/services/templates';

// Story Store using Svelte 5 runes
class StoryStore {
  // Current active story
  currentStory = $state<Story | null>(null);
  entries = $state<StoryEntry[]>([]);

  // World state for current story
  characters = $state<Character[]>([]);
  locations = $state<Location[]>([]);
  items = $state<Item[]>([]);
  storyBeats = $state<StoryBeat[]>([]);

  // Story library
  allStories = $state<Story[]>([]);

  // Derived states
  get currentLocation(): Location | undefined {
    return this.locations.find(l => l.current);
  }

  get activeCharacters(): Character[] {
    return this.characters.filter(c => c.status === 'active');
  }

  get inventoryItems(): Item[] {
    return this.items.filter(i => i.location === 'inventory');
  }

  get equippedItems(): Item[] {
    return this.items.filter(i => i.equipped);
  }

  get pendingQuests(): StoryBeat[] {
    return this.storyBeats.filter(b => b.status === 'pending' || b.status === 'active');
  }

  get wordCount(): number {
    return this.entries.reduce((count, entry) => {
      return count + entry.content.split(/\s+/).filter(Boolean).length;
    }, 0);
  }

  // Load all stories for library view
  async loadAllStories(): Promise<void> {
    this.allStories = await database.getAllStories();
  }

  // Load a specific story with all its data
  async loadStory(storyId: string): Promise<void> {
    const story = await database.getStory(storyId);
    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }

    this.currentStory = story;

    // Load all related data in parallel
    const [entries, characters, locations, items, storyBeats] = await Promise.all([
      database.getStoryEntries(storyId),
      database.getCharacters(storyId),
      database.getLocations(storyId),
      database.getItems(storyId),
      database.getStoryBeats(storyId),
    ]);

    this.entries = entries;
    this.characters = characters;
    this.locations = locations;
    this.items = items;
    this.storyBeats = storyBeats;
  }

  // Create a new story
  async createStory(title: string, templateId?: string, genre?: string): Promise<Story> {
    const storyData = await database.createStory({
      id: crypto.randomUUID(),
      title,
      description: null,
      genre: genre ?? null,
      templateId: templateId ?? null,
      settings: null,
    });

    this.allStories = [storyData, ...this.allStories];
    return storyData;
  }

  // Create a new story from a template with initialization
  async createStoryFromTemplate(title: string, templateId: string, genre?: string): Promise<Story> {
    const template = BUILTIN_TEMPLATES.find(t => t.id === templateId);

    // Create the base story
    const storyData = await database.createStory({
      id: crypto.randomUUID(),
      title,
      description: template?.description ?? null,
      genre: genre ?? null,
      templateId,
      settings: null,
    });

    this.allStories = [storyData, ...this.allStories];

    // Initialize with template data if available
    if (template?.initialState) {
      const state = template.initialState;

      // Add protagonist as a character if defined
      if (state.protagonist) {
        const protagonist: Character = {
          id: crypto.randomUUID(),
          storyId: storyData.id,
          name: state.protagonist.name ?? 'Protagonist',
          description: state.protagonist.description ?? null,
          relationship: 'self',
          traits: state.protagonist.traits ?? [],
          status: 'active',
          metadata: null,
        };
        await database.addCharacter(protagonist);
      }

      // Add starting location if defined
      if (state.startingLocation) {
        const location: Location = {
          id: crypto.randomUUID(),
          storyId: storyData.id,
          name: state.startingLocation.name ?? 'Starting Location',
          description: state.startingLocation.description ?? null,
          visited: true,
          current: true,
          connections: [],
          metadata: null,
        };
        await database.addLocation(location);
      }

      // Add initial items if defined
      if (state.initialItems) {
        for (const itemData of state.initialItems) {
          const item: Item = {
            id: crypto.randomUUID(),
            storyId: storyData.id,
            name: itemData.name ?? 'Item',
            description: itemData.description ?? null,
            quantity: itemData.quantity ?? 1,
            equipped: false,
            location: 'inventory',
            metadata: null,
          };
          await database.addItem(item);
        }
      }

      // Add opening scene as first narration entry
      if (state.openingScene) {
        await database.addStoryEntry({
          id: crypto.randomUUID(),
          storyId: storyData.id,
          type: 'narration',
          content: state.openingScene,
          parentId: null,
          position: 0,
          metadata: { source: 'template' },
        });
      }
    }

    return storyData;
  }

  // Add a new story entry
  async addEntry(type: StoryEntry['type'], content: string, metadata?: StoryEntry['metadata']): Promise<StoryEntry> {
    if (!this.currentStory) {
      throw new Error('No story loaded');
    }

    const position = await database.getNextEntryPosition(this.currentStory.id);
    const entry = await database.addStoryEntry({
      id: crypto.randomUUID(),
      storyId: this.currentStory.id,
      type,
      content,
      parentId: null,
      position,
      metadata: metadata ?? null,
    });

    this.entries = [...this.entries, entry];

    // Update story's updatedAt
    await database.updateStory(this.currentStory.id, {});

    return entry;
  }

  // Update a story entry
  async updateEntry(entryId: string, content: string): Promise<void> {
    if (!this.currentStory) throw new Error('No story loaded');

    await database.updateStoryEntry(entryId, { content });
    this.entries = this.entries.map(e =>
      e.id === entryId ? { ...e, content } : e
    );

    // Update story's updatedAt
    await database.updateStory(this.currentStory.id, {});
  }

  // Delete a story entry
  async deleteEntry(entryId: string): Promise<void> {
    if (!this.currentStory) throw new Error('No story loaded');

    await database.deleteStoryEntry(entryId);
    this.entries = this.entries.filter(e => e.id !== entryId);

    // Update story's updatedAt
    await database.updateStory(this.currentStory.id, {});
  }

  // Add a character
  async addCharacter(name: string, description?: string, relationship?: string): Promise<Character> {
    if (!this.currentStory) throw new Error('No story loaded');

    const character: Character = {
      id: crypto.randomUUID(),
      storyId: this.currentStory.id,
      name,
      description: description ?? null,
      relationship: relationship ?? null,
      traits: [],
      status: 'active',
      metadata: null,
    };

    await database.addCharacter(character);
    this.characters = [...this.characters, character];
    return character;
  }

  // Add a location
  async addLocation(name: string, description?: string, makeCurrent = false): Promise<Location> {
    if (!this.currentStory) throw new Error('No story loaded');

    const location: Location = {
      id: crypto.randomUUID(),
      storyId: this.currentStory.id,
      name,
      description: description ?? null,
      visited: makeCurrent,
      current: makeCurrent,
      connections: [],
      metadata: null,
    };

    await database.addLocation(location);

    if (makeCurrent) {
      // Update other locations to not be current
      this.locations = this.locations.map(l => ({ ...l, current: false }));
    }

    this.locations = [...this.locations, location];
    return location;
  }

  // Set current location
  async setCurrentLocation(locationId: string): Promise<void> {
    if (!this.currentStory) throw new Error('No story loaded');

    await database.setCurrentLocation(this.currentStory.id, locationId);
    this.locations = this.locations.map(l => ({
      ...l,
      current: l.id === locationId,
      visited: l.id === locationId ? true : l.visited,
    }));
  }

  // Add an item to inventory
  async addItem(name: string, description?: string, quantity = 1): Promise<Item> {
    if (!this.currentStory) throw new Error('No story loaded');

    const item: Item = {
      id: crypto.randomUUID(),
      storyId: this.currentStory.id,
      name,
      description: description ?? null,
      quantity,
      equipped: false,
      location: 'inventory',
      metadata: null,
    };

    await database.addItem(item);
    this.items = [...this.items, item];
    return item;
  }

  // Add a story beat
  async addStoryBeat(title: string, type: StoryBeat['type'], description?: string): Promise<StoryBeat> {
    if (!this.currentStory) throw new Error('No story loaded');

    const beat: StoryBeat = {
      id: crypto.randomUUID(),
      storyId: this.currentStory.id,
      title,
      description: description ?? null,
      type,
      status: 'pending',
      triggeredAt: null,
      metadata: null,
    };

    await database.addStoryBeat(beat);
    this.storyBeats = [...this.storyBeats, beat];
    return beat;
  }

  // Clear current story (when switching or closing)
  clearCurrentStory(): void {
    this.currentStory = null;
    this.entries = [];
    this.characters = [];
    this.locations = [];
    this.items = [];
    this.storyBeats = [];
  }

  // Delete a story
  async deleteStory(storyId: string): Promise<void> {
    await database.deleteStory(storyId);
    this.allStories = this.allStories.filter(s => s.id !== storyId);

    if (this.currentStory?.id === storyId) {
      this.clearCurrentStory();
    }
  }
}

export const story = new StoryStore();
