<script lang="ts">
  import { scenarioVault } from '$lib/stores/scenarioVault.svelte';
  import type { VaultScenario } from '$lib/types';
  import { X, Search, Loader2, MapPin } from 'lucide-svelte';
  import VaultScenarioCard from './VaultScenarioCard.svelte';

  interface Props {
    onSelect: (scenario: VaultScenario) => void;
    onClose: () => void;
  }

  let { onSelect, onClose }: Props = $props();

  let searchQuery = $state('');

  // Load on mount
  $effect(() => {
    if (!scenarioVault.isLoaded) scenarioVault.load();
  });

  const filteredScenarios = $derived.by(() => {
    let items = scenarioVault.scenarios;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    return items;
  });
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
  <div class="card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-700 pb-4 shrink-0">
      <div class="flex items-center gap-2">
        <MapPin class="h-5 w-5 text-green-400" />
        <h2 class="text-lg font-semibold text-surface-100">Select Scenario from Vault</h2>
      </div>
      <button class="btn-ghost rounded-lg p-2 text-surface-400 hover:text-surface-100" onclick={onClose}>
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Search -->
    <div class="py-3 shrink-0">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search scenarios..."
          class="w-full rounded-lg border border-surface-600 bg-surface-700 pl-10 pr-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      {#if !scenarioVault.isLoaded}
        <div class="flex h-full items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-surface-500" />
        </div>
      {:else if filteredScenarios.length === 0}
        <div class="flex h-full items-center justify-center py-12">
          <div class="text-center">
            <MapPin class="mx-auto h-12 w-12 text-surface-600" />
            <p class="mt-3 text-surface-400">
              {#if searchQuery}
                No scenarios match your search
              {:else}
                No scenarios in vault yet
              {/if}
            </p>
            <p class="mt-1 text-sm text-surface-500">
              Import character cards as scenarios in the Vault
            </p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-3 p-1">
          {#each filteredScenarios as scenario (scenario.id)}
            <VaultScenarioCard
              {scenario}
              selectable
              onSelect={() => onSelect(scenario)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
