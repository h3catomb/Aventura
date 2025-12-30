<script lang="ts">
  import type { StoryEntry } from '$lib/types';
  import { story } from '$lib/stores/story.svelte';
  import { User, BookOpen, Info, Pencil, Trash2, Check, X } from 'lucide-svelte';

  let { entry }: { entry: StoryEntry } = $props();

  let isEditing = $state(false);
  let editContent = $state('');
  let isDeleting = $state(false);

  const icons = {
    user_action: User,
    narration: BookOpen,
    system: Info,
    retry: BookOpen,
  };

  const styles = {
    user_action: 'border-l-accent-500 bg-accent-500/5',
    narration: 'border-l-surface-600 bg-surface-800/50',
    system: 'border-l-surface-500 bg-surface-800/30 italic text-surface-400',
    retry: 'border-l-amber-500 bg-amber-500/5',
  };

  const Icon = $derived(icons[entry.type]);

  function startEdit() {
    editContent = entry.content;
    isEditing = true;
  }

  async function saveEdit() {
    if (editContent.trim() && editContent !== entry.content) {
      await story.updateEntry(entry.id, editContent.trim());
    }
    isEditing = false;
  }

  function cancelEdit() {
    isEditing = false;
    editContent = '';
  }

  async function confirmDelete() {
    await story.deleteEntry(entry.id);
    isDeleting = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelEdit();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      saveEdit();
    }
  }
</script>

<div class="group rounded-lg border-l-4 p-4 {styles[entry.type]} relative">
  <div class="flex items-start gap-3">
    <div class="mt-0.5 rounded-full bg-surface-700 p-1.5">
      <Icon class="h-4 w-4 text-surface-400" />
    </div>
    <div class="flex-1">
      {#if entry.type === 'user_action'}
        <p class="user-action mb-1 text-sm font-medium">You</p>
      {/if}

      {#if isEditing}
        <div class="space-y-2">
          <textarea
            bind:value={editContent}
            onkeydown={handleKeydown}
            class="input min-h-[100px] w-full resize-y text-sm"
            rows="4"
          ></textarea>
          <div class="flex gap-2">
            <button
              onclick={saveEdit}
              class="btn btn-primary flex items-center gap-1 text-xs"
            >
              <Check class="h-3 w-3" />
              Save
            </button>
            <button
              onclick={cancelEdit}
              class="btn btn-secondary flex items-center gap-1 text-xs"
            >
              <X class="h-3 w-3" />
              Cancel
            </button>
          </div>
          <p class="text-xs text-surface-500">Ctrl+Enter to save, Esc to cancel</p>
        </div>
      {:else if isDeleting}
        <div class="space-y-2">
          <p class="text-sm text-surface-300">Delete this entry?</p>
          <div class="flex gap-2">
            <button
              onclick={confirmDelete}
              class="btn flex items-center gap-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <Trash2 class="h-3 w-3" />
              Delete
            </button>
            <button
              onclick={() => isDeleting = false}
              class="btn btn-secondary flex items-center gap-1 text-xs"
            >
              <X class="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      {:else}
        <div class="story-text whitespace-pre-wrap">
          {entry.content}
        </div>
        {#if entry.metadata?.tokenCount}
          <p class="mt-2 text-xs text-surface-500">
            {entry.metadata.tokenCount} tokens
          </p>
        {/if}
      {/if}
    </div>

    <!-- Edit/Delete buttons (shown on hover) -->
    {#if !isEditing && !isDeleting && entry.type !== 'system'}
      <div class="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onclick={startEdit}
          class="rounded p-1.5 text-surface-400 hover:bg-surface-600 hover:text-surface-200"
          title="Edit entry"
        >
          <Pencil class="h-3.5 w-3.5" />
        </button>
        <button
          onclick={() => isDeleting = true}
          class="rounded p-1.5 text-surface-400 hover:bg-red-500/20 hover:text-red-400"
          title="Delete entry"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    {/if}
  </div>
</div>
