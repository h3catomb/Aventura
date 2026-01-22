<script lang="ts">
  import { story } from "$lib/stores/story.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import { exportService } from "$lib/services/export";
  import { ask } from "@tauri-apps/plugin-dialog";
  import {
    BookOpen,
    Trash2,
    Clock,
    Upload,
    RefreshCw,
    Archive,
    Plus,
  } from "lucide-svelte";
  import SetupWizard from "../wizard/SetupWizard.svelte";

  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Input } from "$lib/components/ui/input";

  // File input for import (HTML-based for mobile compatibility)
  let importFileInput: HTMLInputElement;

  let showSetupWizard = $state(false);
  let setupWizardKey = $state(0);

  // Load stories on mount
  $effect(() => {
    story.loadAllStories();
  });

  function openSetupWizard() {
    setupWizardKey += 1;
    showSetupWizard = true;
  }

  async function openStory(storyId: string) {
    await story.loadStory(storyId);
    ui.setActivePanel("story");
  }

  async function deleteStory(storyId: string, event: MouseEvent) {
    event.stopPropagation();
    const confirmed = await ask(
      "Are you sure you want to delete this story? This action cannot be undone.",
      {
        title: "Delete Story",
        kind: "warning",
      },
    );
    if (confirmed) {
      await story.deleteStory(storyId);
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getGenreColor(genre: string | null): string {
    switch (genre) {
      case "Fantasy":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "Sci-Fi":
        return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/20";
      case "Mystery":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "Horror":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20";
      case "Slice of Life":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20";
      case "Historical":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  }

  let importError = $state<string | null>(null);

  function triggerImport() {
    importFileInput?.click();
  }

  async function handleImportFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    importError = null;

    try {
      const content = await file.text();
      const result = await exportService.importFromContent(content);

      if (result.success && result.storyId) {
        await story.loadAllStories();
        await story.loadStory(result.storyId);
        ui.setActivePanel("story");
      } else if (result.error) {
        importError = result.error;
        setTimeout(() => (importError = null), 5000);
      }
    } catch (error) {
      importError =
        error instanceof Error ? error.message : "Failed to read file";
      setTimeout(() => (importError = null), 5000);
    }

    // Reset file input for re-selection
    input.value = "";
  }
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6 relative bg-background">
  <div class="mx-auto max-w-5xl min-h-full flex flex-col">
    <!-- Header -->
    <div
      class="mb-6 sm:mb-8 flex flex-row items-start justify-between gap-3 sm:gap-4"
    >
      <div class="flex-1 min-w-0 mr-2">
        <h1
          class="text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate"
        >
          Story Library
        </h1>
        <p class="text-sm sm:text-base text-muted-foreground truncate">
          Your adventures await
        </p>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onclick={() => ui.openSyncModal()}
          title="Sync stories between devices"
          class="h-10 w-10 sm:w-auto sm:h-10 sm:px-4"
        >
          <RefreshCw class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">Sync</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={() => ui.setActivePanel("vault")}
          title="Vault"
          class="h-10 w-10 sm:w-auto sm:h-10 sm:px-4"
        >
          <Archive class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">Vault</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={triggerImport}
          title="Import Story"
          class="h-10 w-10 sm:w-auto sm:h-10 sm:px-4"
        >
          <Upload class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">Import</span>
        </Button>
        <input
          type="file"
          accept="*/*,.avt,.json,application/json,application/octet-stream"
          class="hidden"
          bind:this={importFileInput}
          onchange={handleImportFileSelect}
        />
        <Button
          variant="default"
          size="icon"
          onclick={openSetupWizard}
          title="New Story"
          class="h-10 w-10 sm:w-auto sm:h-10 sm:px-4"
        >
          <Plus class="h-5 w-5 sm:h-4 sm:w-4" />
          <span class="hidden sm:inline">New Story</span>
        </Button>
      </div>
    </div>

    <!-- Import error message -->
    {#if importError}
      <div
        class="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20"
      >
        {importError}
      </div>
    {/if}

    <!-- Stories grid -->
    {#if story.allStories.length === 0}
      <div
        class="flex flex-col items-center justify-center flex-1 text-center px-4 pb-20"
      >
        <div class="rounded-full bg-muted p-6 mb-3">
          <BookOpen class="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 class="text-xl font-semibold text-foreground">No stories yet</h2>
        <p class="text-muted-foreground max-w-sm">
          Create your first adventure to get started. You can also import
          existing stories.
        </p>
        <Button variant="default" class="mt-5" onclick={openSetupWizard}>
          <Plus class="h-4 w-4" />
          Create Story
        </Button>
      </div>
    {:else}
      <div
        class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {#each story.allStories as s (s.id)}
          <div
            role="button"
            tabindex="0"
            onclick={() => openStory(s.id)}
            onkeydown={(e) => e.key === "Enter" && openStory(s.id)}
            class="h-full"
          >
            <Card.Root
              class="group cursor-pointer h-full transition-all hover:shadow-md hover:border-primary relative overflow-hidden"
            >
              <Card.Header>
                <div class="flex justify-between items-start gap-2">
                  <Card.Title
                    class="text-lg font-semibold leading-tight truncate"
                  >
                    {s.title}
                  </Card.Title>
                  <Button
                    variant="link"
                    size="icon"
                    class="h-8 w-8 absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                    onclick={(e) => deleteStory(s.id, e)}
                    title="Delete story"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
                {#if s.genre}
                  <div>
                    <Badge
                      variant="outline"
                      class="{getGenreColor(s.genre)} border"
                    >
                      {s.genre}
                    </Badge>
                  </div>
                {/if}
              </Card.Header>
              <Card.Content>
                {#if s.description}
                  <p class="text-sm text-muted-foreground line-clamp-3">
                    {s.description}
                  </p>
                {:else}
                  <p class="text-sm text-muted-foreground italic">
                    No description
                  </p>
                {/if}
              </Card.Content>
              <Card.Footer class="text-xs text-muted-foreground pt-0 mt-auto">
                <div class="flex items-center gap-1">
                  <Clock class="h-3 w-3" />
                  <span>Updated {formatDate(s.updatedAt)}</span>
                </div>
              </Card.Footer>
            </Card.Root>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Discord Link -->
  <a
    href="https://discord.gg/DqVzhSPC46"
    target="_blank"
    rel="noopener noreferrer"
    class="hidden sm:flex fixed bottom-6 left-6 items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground shadow-lg transition-all hover:bg-secondary/80 hover:scale-105 z-40"
  >
    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
    <span class="hidden sm:inline">Official Aventuras Discord</span>
  </a>
</div>

<!-- Setup Wizard -->
{#if showSetupWizard}
  {#key setupWizardKey}
    <SetupWizard onClose={() => (showSetupWizard = false)} />
  {/key}
{/if}
