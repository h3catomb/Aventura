<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { X, Key, Cpu, Palette } from 'lucide-svelte';

  let activeTab = $state<'api' | 'generation' | 'ui'>('api');

  // Local state for API key (to avoid showing actual key)
  let apiKeyInput = $state('');
  let apiKeySet = $state(false);

  $effect(() => {
    apiKeySet = !!settings.apiSettings.openrouterApiKey;
  });

  async function saveApiKey() {
    if (apiKeyInput.trim()) {
      await settings.setApiKey(apiKeyInput.trim());
      apiKeyInput = '';
    }
  }

  async function clearApiKey() {
    await settings.setApiKey('');
    apiKeySet = false;
  }

  const popularModels = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' },
    { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  ];
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onclick={() => ui.closeSettings()}>
  <div
    class="card w-full max-w-2xl max-h-[80vh] overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-700 pb-4">
      <h2 class="text-xl font-semibold text-surface-100">Settings</h2>
      <button class="btn-ghost rounded-lg p-2" onclick={() => ui.closeSettings()}>
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-surface-700 py-2">
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        class:bg-surface-700={activeTab === 'api'}
        class:text-surface-100={activeTab === 'api'}
        class:text-surface-400={activeTab !== 'api'}
        onclick={() => activeTab = 'api'}
      >
        <Key class="h-4 w-4" />
        API
      </button>
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        class:bg-surface-700={activeTab === 'generation'}
        class:text-surface-100={activeTab === 'generation'}
        class:text-surface-400={activeTab !== 'generation'}
        onclick={() => activeTab = 'generation'}
      >
        <Cpu class="h-4 w-4" />
        Generation
      </button>
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        class:bg-surface-700={activeTab === 'ui'}
        class:text-surface-100={activeTab === 'ui'}
        class:text-surface-400={activeTab !== 'ui'}
        onclick={() => activeTab = 'ui'}
      >
        <Palette class="h-4 w-4" />
        Interface
      </button>
    </div>

    <!-- Content -->
    <div class="max-h-96 overflow-y-auto py-4">
      {#if activeTab === 'api'}
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              OpenRouter API Key
            </label>
            {#if apiKeySet}
              <div class="flex items-center gap-2">
                <div class="input flex-1 bg-surface-700 text-surface-400">
                  ••••••••••••••••••••
                </div>
                <button class="btn btn-secondary" onclick={clearApiKey}>
                  Clear
                </button>
              </div>
              <p class="mt-1 text-sm text-green-400">API key configured</p>
            {:else}
              <div class="flex gap-2">
                <input
                  type="password"
                  bind:value={apiKeyInput}
                  placeholder="sk-or-..."
                  class="input flex-1"
                />
                <button
                  class="btn btn-primary"
                  onclick={saveApiKey}
                  disabled={!apiKeyInput.trim()}
                >
                  Save
                </button>
              </div>
            {/if}
            <p class="mt-2 text-sm text-surface-500">
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" class="text-accent-400 hover:underline">openrouter.ai</a>
            </p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              Default Model
            </label>
            <select
              class="input"
              value={settings.apiSettings.defaultModel}
              onchange={(e) => settings.setDefaultModel(e.currentTarget.value)}
            >
              {#each popularModels as model}
                <option value={model.id}>{model.name}</option>
              {/each}
            </select>
          </div>
        </div>
      {:else if activeTab === 'generation'}
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              Temperature: {settings.apiSettings.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.apiSettings.temperature}
              oninput={(e) => settings.setTemperature(parseFloat(e.currentTarget.value))}
              class="w-full"
            />
            <div class="flex justify-between text-xs text-surface-500">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              Max Tokens: {settings.apiSettings.maxTokens}
            </label>
            <input
              type="range"
              min="256"
              max="4096"
              step="128"
              value={settings.apiSettings.maxTokens}
              oninput={(e) => settings.setMaxTokens(parseInt(e.currentTarget.value))}
              class="w-full"
            />
            <div class="flex justify-between text-xs text-surface-500">
              <span>Shorter</span>
              <span>Longer</span>
            </div>
          </div>
        </div>
      {:else if activeTab === 'ui'}
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              Theme
            </label>
            <select
              class="input"
              value={settings.uiSettings.theme}
              onchange={(e) => settings.setTheme(e.currentTarget.value as 'dark' | 'light')}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-surface-300">
              Font Size
            </label>
            <select
              class="input"
              value={settings.uiSettings.fontSize}
              onchange={(e) => settings.setFontSize(e.currentTarget.value as 'small' | 'medium' | 'large')}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-surface-300">Show Word Count</label>
            <input
              type="checkbox"
              checked={settings.uiSettings.showWordCount}
              onchange={() => {
                settings.uiSettings.showWordCount = !settings.uiSettings.showWordCount;
              }}
              class="h-5 w-5 rounded border-surface-600 bg-surface-700"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
