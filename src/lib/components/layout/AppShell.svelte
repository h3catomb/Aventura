<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { story } from '$lib/stores/story.svelte';
  import Sidebar from './Sidebar.svelte';
  import Header from './Header.svelte';
  import StoryView from '$lib/components/story/StoryView.svelte';
  import LibraryView from '$lib/components/story/LibraryView.svelte';
  import SettingsModal from '$lib/components/settings/SettingsModal.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="flex h-screen w-screen bg-surface-900">
  <!-- Sidebar -->
  {#if ui.sidebarOpen && story.currentStory}
    <Sidebar />
  {/if}

  <!-- Main content area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <Header />

    <main class="flex-1 overflow-hidden">
      {#if ui.activePanel === 'story' && story.currentStory}
        <StoryView />
      {:else if ui.activePanel === 'library' || !story.currentStory}
        <LibraryView />
      {:else if children}
        {@render children()}
      {/if}
    </main>
  </div>

  <!-- Settings Modal -->
  {#if ui.settingsModalOpen}
    <SettingsModal />
  {/if}
</div>
