<script lang="ts">
  import { story } from '$lib/stores/story.svelte';
  import { Plus, User, Heart, Skull, UserX } from 'lucide-svelte';

  let showAddForm = $state(false);
  let newName = $state('');
  let newDescription = $state('');
  let newRelationship = $state('');

  async function addCharacter() {
    if (!newName.trim()) return;
    await story.addCharacter(newName.trim(), newDescription.trim() || undefined, newRelationship.trim() || undefined);
    newName = '';
    newDescription = '';
    newRelationship = '';
    showAddForm = false;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'active': return User;
      case 'inactive': return UserX;
      case 'deceased': return Skull;
      default: return User;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-surface-500';
      case 'deceased': return 'text-red-400';
      default: return 'text-surface-400';
    }
  }

  function renderStatusIcon(status: string) {
    return getStatusIcon(status);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="font-medium text-surface-200">Characters</h3>
    <button
      class="btn-ghost rounded p-1"
      onclick={() => showAddForm = !showAddForm}
      title="Add character"
    >
      <Plus class="h-4 w-4" />
    </button>
  </div>

  {#if showAddForm}
    <div class="card space-y-2">
      <input
        type="text"
        bind:value={newName}
        placeholder="Character name"
        class="input text-sm"
      />
      <input
        type="text"
        bind:value={newRelationship}
        placeholder="Relationship (e.g., ally, enemy)"
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
        <button class="btn btn-primary text-xs" onclick={addCharacter} disabled={!newName.trim()}>
          Add
        </button>
      </div>
    </div>
  {/if}

  {#if story.characters.length === 0}
    <p class="py-4 text-center text-sm text-surface-500">
      No characters yet
    </p>
  {:else}
    <div class="space-y-2">
      {#each story.characters as character (character.id)}
        {@const StatusIcon = getStatusIcon(character.status)}
        <div class="card p-3">
          <div class="flex items-start gap-2">
            <div class="rounded-full bg-surface-700 p-1.5 {getStatusColor(character.status)}">
              <StatusIcon class="h-4 w-4" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-surface-100">{character.name}</span>
                {#if character.relationship}
                  <span class="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
                    {character.relationship}
                  </span>
                {/if}
              </div>
              {#if character.description}
                <p class="mt-1 text-sm text-surface-400">{character.description}</p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
