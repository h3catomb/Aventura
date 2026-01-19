<script lang="ts">
  import { lorebookVault } from "$lib/stores/lorebookVault.svelte";
  import type { VaultLorebook } from "$lib/types";
  import { Search, Archive, Loader2 } from "lucide-svelte";
  import VaultLorebookCard from "./VaultLorebookCard.svelte";

    interface Props {
    onSelect: (lorebook: VaultLorebook) => void;
    /** IDs of lorebooks that have already been imported (to show visual indicator) */
    importedLorebookIds?: string[];
    onNavigateToVault?: () => void;
  }

  let { onSelect, importedLorebookIds = [], onNavigateToVault }: Props = $props();

  let searchQuery = $state("");

  const filteredLorebooks = $derived.by(() => {
    let books = lorebookVault.lorebooks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      books = books.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Sort favorites first, then by updated
    return [...books].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.updatedAt - a.updatedAt;
    });
  });

  $effect(() => {
    if (!lorebookVault.isLoaded) {
      lorebookVault.load();
    }
  });

  function handleSelect(lorebook: VaultLorebook) {
    onSelect(lorebook);
  }

  function isAlreadyImported(lorebookId: string): boolean {
    return importedLorebookIds.includes(lorebookId);
  }
</script>

<div class="space-y-3">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <Archive class="h-4 w-4 text-accent-400" />
    <h3 class="text-sm font-medium text-surface-200">Add from Vault</h3>
  </div>

  <!-- Search -->
  <div class="relative">
    <Search
      class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500"
    />
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search lorebooks..."
      class="w-full rounded-lg border border-surface-600 bg-surface-800 pl-10 pr-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
    />
  </div>

  <!-- Lorebook List -->
  <div class="max-h-64 overflow-y-auto">
    {#if !lorebookVault.isLoaded}
      <div class="flex h-32 items-center justify-center">
        <Loader2 class="h-6 w-6 animate-spin text-surface-500" />
      </div>
    {:else if filteredLorebooks.length === 0}
      <div class="flex h-32 items-center justify-center">
        <div class="text-center">
          <Archive class="mx-auto h-8 w-8 text-surface-600" />
          <p class="mt-2 text-sm text-surface-400">
            {#if searchQuery}
              No lorebooks match your search
            {:else}
              No lorebooks in vault
            {/if}
          </p>
          {#if !searchQuery && onNavigateToVault}
            <button
              class="mt-3 px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-xs text-surface-200 transition-colors"
              onclick={onNavigateToVault}
            >
              Go to Vault
            </button>
          {:else}
            <p class="mt-1 text-xs text-surface-500">
              Upload a lorebook above to get started
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each filteredLorebooks as lorebook (lorebook.id)}
          <button
            class="relative text-left rounded-lg border border-surface-700 bg-surface-800 p-3 hover:ring-2 hover:ring-accent-500 transition-all {isAlreadyImported(lorebook.id) ? 'opacity-50' : ''}"
            onclick={() => handleSelect(lorebook)}
            disabled={isAlreadyImported(lorebook.id)}
          >
            {#if isAlreadyImported(lorebook.id)}
              <div class="absolute top-2 right-2 text-xs text-surface-400 bg-surface-700 px-1.5 py-0.5 rounded">
                Added
              </div>
            {/if}
            <div class="flex items-start gap-2">
              <Archive class="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-surface-100 truncate text-sm">{lorebook.name}</h4>
                <p class="text-xs text-surface-400 mt-0.5">
                  {lorebook.entries.length} entries
                </p>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
