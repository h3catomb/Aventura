import Database from '@tauri-apps/plugin-sql';
import type { Story, StoryEntry, Character, Location, Item, StoryBeat, Template } from '$lib/types';

class DatabaseService {
  private db: Database | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await Database.load('sqlite:aventura.db');
  }

  private async getDb(): Promise<Database> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDb();
    const result = await db.select<{ value: string }[]>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return result.length > 0 ? result[0].value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  // Story operations
  async getAllStories(): Promise<Story[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM stories ORDER BY updated_at DESC'
    );
    return results.map(this.mapStory);
  }

  async getStory(id: string): Promise<Story | null> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM stories WHERE id = ?',
      [id]
    );
    return results.length > 0 ? this.mapStory(results[0]) : null;
  }

  async createStory(story: Omit<Story, 'createdAt' | 'updatedAt'>): Promise<Story> {
    const db = await this.getDb();
    const now = Date.now();
    await db.execute(
      `INSERT INTO stories (id, title, description, genre, template_id, created_at, updated_at, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        story.id,
        story.title,
        story.description,
        story.genre,
        story.templateId,
        now,
        now,
        story.settings ? JSON.stringify(story.settings) : null,
      ]
    );
    return { ...story, createdAt: now, updatedAt: now };
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();
    const setClauses: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }
    if (updates.genre !== undefined) {
      setClauses.push('genre = ?');
      values.push(updates.genre);
    }
    if (updates.settings !== undefined) {
      setClauses.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }

    values.push(id);
    await db.execute(
      `UPDATE stories SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteStory(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM stories WHERE id = ?', [id]);
  }

  // Story entries operations
  async getStoryEntries(storyId: string): Promise<StoryEntry[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM story_entries WHERE story_id = ? ORDER BY position ASC',
      [storyId]
    );
    return results.map(this.mapStoryEntry);
  }

  async addStoryEntry(entry: Omit<StoryEntry, 'createdAt'>): Promise<StoryEntry> {
    const db = await this.getDb();
    const now = Date.now();
    await db.execute(
      `INSERT INTO story_entries (id, story_id, type, content, parent_id, position, created_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.storyId,
        entry.type,
        entry.content,
        entry.parentId,
        entry.position,
        now,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
    return { ...entry, createdAt: now };
  }

  async getNextEntryPosition(storyId: string): Promise<number> {
    const db = await this.getDb();
    const result = await db.select<{ maxPos: number | null }[]>(
      'SELECT MAX(position) as maxPos FROM story_entries WHERE story_id = ?',
      [storyId]
    );
    return (result[0]?.maxPos ?? -1) + 1;
  }

  async updateStoryEntry(id: string, updates: Partial<StoryEntry>): Promise<void> {
    const db = await this.getDb();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      setClauses.push('content = ?');
      values.push(updates.content);
    }
    if (updates.type !== undefined) {
      setClauses.push('type = ?');
      values.push(updates.type);
    }
    if (updates.metadata !== undefined) {
      setClauses.push('metadata = ?');
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
    }

    if (setClauses.length === 0) return;
    values.push(id);
    await db.execute(
      `UPDATE story_entries SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteStoryEntry(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM story_entries WHERE id = ?', [id]);
  }

  // Character operations
  async getCharacters(storyId: string): Promise<Character[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM characters WHERE story_id = ?',
      [storyId]
    );
    return results.map(this.mapCharacter);
  }

  async addCharacter(character: Character): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      `INSERT INTO characters (id, story_id, name, description, relationship, traits, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        character.id,
        character.storyId,
        character.name,
        character.description,
        character.relationship,
        JSON.stringify(character.traits),
        character.status,
        character.metadata ? JSON.stringify(character.metadata) : null,
      ]
    );
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    const db = await this.getDb();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { setClauses.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { setClauses.push('description = ?'); values.push(updates.description); }
    if (updates.relationship !== undefined) { setClauses.push('relationship = ?'); values.push(updates.relationship); }
    if (updates.traits !== undefined) { setClauses.push('traits = ?'); values.push(JSON.stringify(updates.traits)); }
    if (updates.status !== undefined) { setClauses.push('status = ?'); values.push(updates.status); }
    if (updates.metadata !== undefined) { setClauses.push('metadata = ?'); values.push(JSON.stringify(updates.metadata)); }

    if (setClauses.length === 0) return;
    values.push(id);
    await db.execute(`UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`, values);
  }

  // Location operations
  async getLocations(storyId: string): Promise<Location[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM locations WHERE story_id = ?',
      [storyId]
    );
    return results.map(this.mapLocation);
  }

  async addLocation(location: Location): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      `INSERT INTO locations (id, story_id, name, description, visited, current, connections, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        location.id,
        location.storyId,
        location.name,
        location.description,
        location.visited ? 1 : 0,
        location.current ? 1 : 0,
        JSON.stringify(location.connections),
        location.metadata ? JSON.stringify(location.metadata) : null,
      ]
    );
  }

  async setCurrentLocation(storyId: string, locationId: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('UPDATE locations SET current = 0 WHERE story_id = ?', [storyId]);
    await db.execute('UPDATE locations SET current = 1, visited = 1 WHERE id = ?', [locationId]);
  }

  // Item operations
  async getItems(storyId: string): Promise<Item[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM items WHERE story_id = ?',
      [storyId]
    );
    return results.map(this.mapItem);
  }

  async addItem(item: Item): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      `INSERT INTO items (id, story_id, name, description, quantity, equipped, location, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.storyId,
        item.name,
        item.description,
        item.quantity,
        item.equipped ? 1 : 0,
        item.location,
        item.metadata ? JSON.stringify(item.metadata) : null,
      ]
    );
  }

  // Story beats operations
  async getStoryBeats(storyId: string): Promise<StoryBeat[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>(
      'SELECT * FROM story_beats WHERE story_id = ?',
      [storyId]
    );
    return results.map(this.mapStoryBeat);
  }

  async addStoryBeat(beat: StoryBeat): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      `INSERT INTO story_beats (id, story_id, title, description, type, status, triggered_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        beat.id,
        beat.storyId,
        beat.title,
        beat.description,
        beat.type,
        beat.status,
        beat.triggeredAt,
        beat.metadata ? JSON.stringify(beat.metadata) : null,
      ]
    );
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    const db = await this.getDb();
    const results = await db.select<any[]>('SELECT * FROM templates ORDER BY is_builtin DESC, name ASC');
    return results.map(this.mapTemplate);
  }

  async addTemplate(template: Template): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      `INSERT INTO templates (id, name, description, genre, system_prompt, initial_state, is_builtin, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.id,
        template.name,
        template.description,
        template.genre,
        template.systemPrompt,
        template.initialState ? JSON.stringify(template.initialState) : null,
        template.isBuiltin ? 1 : 0,
        template.createdAt,
      ]
    );
  }

  // Mapping functions
  private mapStory(row: any): Story {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      genre: row.genre,
      templateId: row.template_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      settings: row.settings ? JSON.parse(row.settings) : null,
    };
  }

  private mapStoryEntry(row: any): StoryEntry {
    return {
      id: row.id,
      storyId: row.story_id,
      type: row.type,
      content: row.content,
      parentId: row.parent_id,
      position: row.position,
      createdAt: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapCharacter(row: any): Character {
    return {
      id: row.id,
      storyId: row.story_id,
      name: row.name,
      description: row.description,
      relationship: row.relationship,
      traits: row.traits ? JSON.parse(row.traits) : [],
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapLocation(row: any): Location {
    return {
      id: row.id,
      storyId: row.story_id,
      name: row.name,
      description: row.description,
      visited: row.visited === 1,
      current: row.current === 1,
      connections: row.connections ? JSON.parse(row.connections) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapItem(row: any): Item {
    return {
      id: row.id,
      storyId: row.story_id,
      name: row.name,
      description: row.description,
      quantity: row.quantity,
      equipped: row.equipped === 1,
      location: row.location,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapStoryBeat(row: any): StoryBeat {
    return {
      id: row.id,
      storyId: row.story_id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      triggeredAt: row.triggered_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapTemplate(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      genre: row.genre,
      systemPrompt: row.system_prompt,
      initialState: row.initial_state ? JSON.parse(row.initial_state) : null,
      isBuiltin: row.is_builtin === 1,
      createdAt: row.created_at,
    };
  }
}

export const database = new DatabaseService();
