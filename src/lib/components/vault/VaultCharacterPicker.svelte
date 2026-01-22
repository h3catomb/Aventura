<script lang="ts">
  import { characterVault } from '$lib/stores/characterVault.svelte';
  import type { VaultCharacter, VaultCharacterType } from '$lib/types';
  import { Search, User, Users, Loader2 } from 'lucide-svelte';
  import VaultCharacterCard from './VaultCharacterCard.svelte';
  
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';

  interface Props {
    filterType?: VaultCharacterType;
    onSelect: (character: VaultCharacter) => void;
    onClose: () => void;
  }

  let { filterType, onSelect, onClose }: Props = $props();

  let searchQuery = $state('');

  const filteredCharacters = $derived.by(() => {
    let chars = characterVault.characters;

    if (filterType) {
      chars = chars.filter(c => c.characterType === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.traits.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort favorites first
    // Use spread to create a copy before sorting to avoid mutating the $state array
    return [...chars].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
  });

  $effect(() => {
    if (!characterVault.isLoaded) {
      characterVault.load();
    }
  });

  function handleSelect(character: VaultCharacter) {
    onSelect(character);
  }

  const title = $derived(
    filterType === 'protagonist'
      ? 'Select Protagonist from Vault'
      : filterType === 'supporting'
        ? 'Select Supporting Character from Vault'
        : 'Select Character from Vault'
  );

  const emptyMessage = $derived(
    filterType === 'protagonist'
      ? 'No protagonists in vault'
      : filterType === 'supporting'
        ? 'No supporting characters in vault'
        : 'No characters in vault'
  );
</script>

<Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
  <Dialog.Content class="sm:max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
    <Dialog.Header class="p-4 pb-2 border-b">
      <Dialog.Title class="flex items-center gap-2">
        {#if filterType === 'protagonist'}
          <User class="h-5 w-5 text-primary" />
        {:else}
          <Users class="h-5 w-5 text-muted-foreground" />
        {/if}
        {title}
      </Dialog.Title>
    </Dialog.Header>

    <div class="p-4 pb-2 border-b bg-muted/20">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          bind:value={searchQuery}
          placeholder="Search characters..."
          class="pl-9 bg-background"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      {#if !characterVault.isLoaded}
        <div class="flex h-40 items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      {:else if filteredCharacters.length === 0}
        <div class="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <div class="text-center">
            {#if filterType === 'protagonist'}
              <User class="mx-auto h-10 w-10 text-muted-foreground/50" />
            {:else}
              <Users class="mx-auto h-10 w-10 text-muted-foreground/50" />
            {/if}
            <p class="mt-2 text-muted-foreground">
              {#if searchQuery}
                No characters match your search
              {:else}
                {emptyMessage}
              {/if}
            </p>
            <p class="mt-1 text-sm text-muted-foreground/80">
              Create characters in the Character Vault first
            </p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {#each filteredCharacters as character (character.id)}
            <VaultCharacterCard
              {character}
              selectable
              onSelect={() => handleSelect(character)}
            />
          {/each}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="p-4 pt-2 border-t bg-muted/20">
      <Button variant="ghost" onclick={onClose}>
        Cancel
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
