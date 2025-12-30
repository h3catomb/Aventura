// Core entity types for Aventura

export interface Story {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  templateId: string | null;
  createdAt: number;
  updatedAt: number;
  settings: StorySettings | null;
}

export interface StorySettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
}

export interface StoryEntry {
  id: string;
  storyId: string;
  type: 'user_action' | 'narration' | 'system' | 'retry';
  content: string;
  parentId: string | null;
  position: number;
  createdAt: number;
  metadata: EntryMetadata | null;
}

export interface EntryMetadata {
  tokenCount?: number;
  model?: string;
  generationTime?: number;
  source?: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  description: string | null;
  relationship: string | null;
  traits: string[];
  status: 'active' | 'inactive' | 'deceased';
  metadata: Record<string, unknown> | null;
}

export interface Location {
  id: string;
  storyId: string;
  name: string;
  description: string | null;
  visited: boolean;
  current: boolean;
  connections: string[];
  metadata: Record<string, unknown> | null;
}

export interface Item {
  id: string;
  storyId: string;
  name: string;
  description: string | null;
  quantity: number;
  equipped: boolean;
  location: string;
  metadata: Record<string, unknown> | null;
}

export interface StoryBeat {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  type: 'milestone' | 'quest' | 'revelation' | 'event';
  status: 'pending' | 'active' | 'completed' | 'failed';
  triggeredAt: number | null;
  metadata: Record<string, unknown> | null;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  systemPrompt: string;
  initialState: TemplateInitialState | null;
  isBuiltin: boolean;
  createdAt: number;
}

export interface TemplateInitialState {
  protagonist?: Partial<Character>;
  startingLocation?: Partial<Location>;
  initialItems?: Partial<Item>[];
  openingScene?: string;
}

// UI State types
export type ActivePanel = 'story' | 'library' | 'settings' | 'templates';
export type SidebarTab = 'characters' | 'locations' | 'inventory' | 'quests';

export interface UIState {
  activePanel: ActivePanel;
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  settingsModalOpen: boolean;
}

// API Settings
export interface APISettings {
  openrouterApiKey: string | null;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}

export interface UISettings {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  showWordCount: boolean;
  autoSave: boolean;
}
