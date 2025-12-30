<script lang="ts">
  import { onMount } from 'svelte';
  import { database } from '$lib/services/database';
  import { settings } from '$lib/stores/settings.svelte';
  import AppShell from '$lib/components/layout/AppShell.svelte';

  let initialized = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      // Initialize database connection
      await database.init();

      // Initialize settings from database
      await settings.init();

      initialized = true;
    } catch (e) {
      console.error('Initialization error:', e);
      error = e instanceof Error ? e.message : 'Failed to initialize application';
    }
  });
</script>

{#if error}
  <div class="flex h-screen w-screen items-center justify-center bg-surface-900">
    <div class="card max-w-md text-center">
      <h1 class="text-xl font-semibold text-red-400">Initialization Error</h1>
      <p class="mt-2 text-surface-400">{error}</p>
      <button
        class="btn btn-primary mt-4"
        onclick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  </div>
{:else if !initialized}
  <div class="flex h-screen w-screen items-center justify-center bg-surface-900">
    <div class="flex flex-col items-center gap-4">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent"></div>
      <p class="text-surface-400">Loading Aventura...</p>
    </div>
  </div>
{:else}
  <AppShell>
    <!-- Default slot content if needed -->
  </AppShell>
{/if}
