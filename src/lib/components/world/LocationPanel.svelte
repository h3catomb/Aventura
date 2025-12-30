<script lang="ts">
  import { story } from '$lib/stores/story.svelte';
  import { Plus, MapPin, Eye, Navigation } from 'lucide-svelte';

  let showAddForm = $state(false);
  let newName = $state('');
  let newDescription = $state('');

  async function addLocation() {
    if (!newName.trim()) return;
    const makeCurrent = story.locations.length === 0;
    await story.addLocation(newName.trim(), newDescription.trim() || undefined, makeCurrent);
    newName = '';
    newDescription = '';
    showAddForm = false;
  }

  async function goToLocation(locationId: string) {
    await story.setCurrentLocation(locationId);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="font-medium text-surface-200">Locations</h3>
    <button
      class="btn-ghost rounded p-1"
      onclick={() => showAddForm = !showAddForm}
      title="Add location"
    >
      <Plus class="h-4 w-4" />
    </button>
  </div>

  {#if showAddForm}
    <div class="card space-y-2">
      <input
        type="text"
        bind:value={newName}
        placeholder="Location name"
        class="input text-sm"
      />
      <textarea
        bind:value={newDescription}
        placeholder="Description (optional)"
        class="input text-sm"
        rows="2"
      ></textarea>
      <div class="flex justify-end gap-2">
        <button class="btn btn-secondary text-xs" onclick={() => showAddForm = false}>
          Cancel
        </button>
        <button class="btn btn-primary text-xs" onclick={addLocation} disabled={!newName.trim()}>
          Add
        </button>
      </div>
    </div>
  {/if}

  <!-- Current Location -->
  {#if story.currentLocation}
    <div class="card border-accent-500/50 bg-accent-500/10 p-3">
      <div class="flex items-center gap-2 text-accent-400">
        <Navigation class="h-4 w-4" />
        <span class="text-sm font-medium">Current Location</span>
      </div>
      <h4 class="mt-1 font-medium text-surface-100">{story.currentLocation.name}</h4>
      {#if story.currentLocation.description}
        <p class="mt-1 text-sm text-surface-400">{story.currentLocation.description}</p>
      {/if}
    </div>
  {/if}

  {#if story.locations.length === 0}
    <p class="py-4 text-center text-sm text-surface-500">
      No locations yet
    </p>
  {:else}
    <div class="space-y-2">
      {#each story.locations.filter(l => !l.current) as location (location.id)}
        <div class="card p-3">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-2">
              <div class="rounded-full bg-surface-700 p-1.5">
                <MapPin class="h-4 w-4 text-surface-400" />
              </div>
              <div>
                <span class="font-medium text-surface-100">{location.name}</span>
                {#if location.visited}
                  <span class="ml-2 text-xs text-surface-500">
                    <Eye class="inline h-3 w-3" /> visited
                  </span>
                {/if}
                {#if location.description}
                  <p class="mt-1 text-sm text-surface-400">{location.description}</p>
                {/if}
              </div>
            </div>
            <button
              class="btn-ghost rounded px-2 py-1 text-xs"
              onclick={() => goToLocation(location.id)}
            >
              Go
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
