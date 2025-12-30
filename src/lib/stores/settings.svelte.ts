import type { APISettings, UISettings } from '$lib/types';
import { database } from '$lib/services/database';

// Settings Store using Svelte 5 runes
class SettingsStore {
  apiSettings = $state<APISettings>({
    openrouterApiKey: null,
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.8,
    maxTokens: 1024,
  });

  uiSettings = $state<UISettings>({
    theme: 'dark',
    fontSize: 'medium',
    showWordCount: true,
    autoSave: true,
  });

  initialized = $state(false);

  async init() {
    if (this.initialized) return;

    try {
      // Load API settings
      const apiKey = await database.getSetting('openrouter_api_key');
      const defaultModel = await database.getSetting('default_model');
      const temperature = await database.getSetting('temperature');
      const maxTokens = await database.getSetting('max_tokens');

      if (apiKey) this.apiSettings.openrouterApiKey = apiKey;
      if (defaultModel) this.apiSettings.defaultModel = defaultModel;
      if (temperature) this.apiSettings.temperature = parseFloat(temperature);
      if (maxTokens) this.apiSettings.maxTokens = parseInt(maxTokens);

      // Load UI settings
      const theme = await database.getSetting('theme');
      const fontSize = await database.getSetting('font_size');
      const showWordCount = await database.getSetting('show_word_count');
      const autoSave = await database.getSetting('auto_save');

      if (theme) this.uiSettings.theme = theme as 'dark' | 'light';
      if (fontSize) this.uiSettings.fontSize = fontSize as 'small' | 'medium' | 'large';
      if (showWordCount) this.uiSettings.showWordCount = showWordCount === 'true';
      if (autoSave) this.uiSettings.autoSave = autoSave === 'true';

      this.initialized = true;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.initialized = true; // Mark as initialized even on error to prevent infinite retries
    }
  }

  async setApiKey(key: string) {
    this.apiSettings.openrouterApiKey = key;
    await database.setSetting('openrouter_api_key', key);
  }

  async setDefaultModel(model: string) {
    this.apiSettings.defaultModel = model;
    await database.setSetting('default_model', model);
  }

  async setTemperature(temp: number) {
    this.apiSettings.temperature = temp;
    await database.setSetting('temperature', temp.toString());
  }

  async setMaxTokens(tokens: number) {
    this.apiSettings.maxTokens = tokens;
    await database.setSetting('max_tokens', tokens.toString());
  }

  async setTheme(theme: 'dark' | 'light') {
    this.uiSettings.theme = theme;
    await database.setSetting('theme', theme);
    // Update the document class for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async setFontSize(size: 'small' | 'medium' | 'large') {
    this.uiSettings.fontSize = size;
    await database.setSetting('font_size', size);
  }

  get hasApiKey(): boolean {
    return !!this.apiSettings.openrouterApiKey;
  }
}

export const settings = new SettingsStore();
