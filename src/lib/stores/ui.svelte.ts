import type { ActivePanel, SidebarTab, UIState } from '$lib/types';

// UI State using Svelte 5 runes
class UIStore {
  activePanel = $state<ActivePanel>('story');
  sidebarTab = $state<SidebarTab>('characters');
  sidebarOpen = $state(true);
  settingsModalOpen = $state(false);
  isGenerating = $state(false);

  // Streaming state
  streamingContent = $state('');
  isStreaming = $state(false);

  setActivePanel(panel: ActivePanel) {
    this.activePanel = panel;
  }

  setSidebarTab(tab: SidebarTab) {
    this.sidebarTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  openSettings() {
    this.settingsModalOpen = true;
  }

  closeSettings() {
    this.settingsModalOpen = false;
  }

  setGenerating(value: boolean) {
    this.isGenerating = value;
  }

  // Streaming methods
  startStreaming() {
    this.isStreaming = true;
    this.streamingContent = '';
  }

  appendStreamContent(content: string) {
    this.streamingContent += content;
  }

  endStreaming() {
    this.isStreaming = false;
    this.streamingContent = '';
  }

  getStreamingContent(): string {
    return this.streamingContent;
  }
}

export const ui = new UIStore();
