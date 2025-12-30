<script lang="ts">
  import { story } from '$lib/stores/story.svelte';
  import { Plus, Package, Shield } from 'lucide-svelte';

  let showAddForm = $state(false);
  let newName = $state('');
  let newDescription = $state('');
  let newQuantity = $state(1);

  async function addItem() {
    if (!newName.trim()) return;
    await story.addItem(newName.trim(), newDescription.trim() || undefined, newQuantity);
    newName = '';
    newDescription = '';
    newQuantity = 1;
    showAddForm = false;
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="font-medium text-surface-200">Inventory</h3>
    <button
      class="btn-ghost rounded p-1"
      onclick={() => showAddForm = !showAddForm}
      title="Add item"
    >
      <Plus class="h-4 w-4" />
    </button>
  </div>

  {#if showAddForm}
    <div class="card space-y-2">
      <input
        type="text"
        bind:value={newName}
        placeholder="Item name"
        class="input text-sm"
      />
      <div class="flex gap-2">
        <input
          type="number"
          bind:value={newQuantity}
          min="1"
          class="input w-20 text-sm"
        />
        <span class="self-center text-sm text-surface-400">quantity</span>
      </div>
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
        <button class="btn btn-primary text-xs" onclick={addItem} disabled={!newName.trim()}>
          Add
        </button>
      </div>
    </div>
  {/if}

  <!-- Equipped items -->
  {#if story.equippedItems.length > 0}
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-surface-400">Equipped</h4>
      {#each story.equippedItems as item (item.id)}
        <div class="card border-accent-500/30 bg-accent-500/5 p-3">
          <div class="flex items-center gap-2">
            <Shield class="h-4 w-4 text-accent-400" />
            <span class="font-medium text-surface-100">{item.name}</span>
            {#if item.quantity > 1}
              <span class="text-sm text-surface-400">x{item.quantity}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if story.inventoryItems.length === 0 && story.equippedItems.length === 0}
    <p class="py-4 text-center text-sm text-surface-500">
      No items yet
    </p>
  {:else if story.inventoryItems.length > 0}
    <div class="space-y-2">
      {#if story.equippedItems.length > 0}
        <h4 class="text-sm font-medium text-surface-400">Inventory</h4>
      {/if}
      {#each story.inventoryItems as item (item.id)}
        <div class="card p-3">
          <div class="flex items-start gap-2">
            <div class="rounded-full bg-surface-700 p-1.5">
              <Package class="h-4 w-4 text-surface-400" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-surface-100">{item.name}</span>
                {#if item.quantity > 1}
                  <span class="text-sm text-surface-400">x{item.quantity}</span>
                {/if}
              </div>
              {#if item.description}
                <p class="mt-1 text-sm text-surface-400">{item.description}</p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
