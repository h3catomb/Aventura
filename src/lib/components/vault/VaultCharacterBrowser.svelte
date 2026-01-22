<script lang="ts">
  import { characterVault } from "$lib/stores/characterVault.svelte";
  import type { VaultCharacter, VaultCharacterType } from "$lib/types";
  import { Search, User, Users } from "lucide-svelte";
  import { normalizeImageDataUrl } from "$lib/utils/image";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Avatar from "$lib/components/ui/avatar";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { cn } from "$lib/utils/cn";

  interface Props {
    onSelect: (character: VaultCharacter) => void;
    /** Filter by character type */
    filterType?: VaultCharacterType;
    /** ID of character that has been selected (to show visual indicator) */
    selectedCharacterId?: string | null;
    onNavigateToVault?: () => void;
  }

  let {
    onSelect,
    filterType,
    selectedCharacterId = null,
    onNavigateToVault,
  }: Props = $props();

  let searchQuery = $state("");

  const filteredCharacters = $derived.by(() => {
    let chars = characterVault.characters;

    // Filter by type if specified
    if (filterType) {
      chars = chars.filter((c) => c.characterType === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.traits.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Sort favorites first, then by updated
    return [...chars].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.updatedAt - a.updatedAt;
    });
  });

  const emptyMessage = $derived(
    filterType === "protagonist"
      ? "No protagonists in vault"
      : filterType === "supporting"
        ? "No supporting characters in vault"
        : "No characters in vault",
  );

  $effect(() => {
    if (!characterVault.isLoaded) {
      characterVault.load();
    }
  });

  function handleSelect(character: VaultCharacter) {
    onSelect(character);
  }

  function isSelected(characterId: string): boolean {
    return selectedCharacterId === characterId;
  }
</script>

<div class="space-y-4">
  <!-- Search -->
  {#if characterVault.characters.filter((c) => !filterType || c.characterType === filterType).length > 0}
    <div class="relative">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="text"
        bind:value={searchQuery}
        placeholder="Search characters..."
        class="pl-9 bg-background"
      />
    </div>
  {/if}

  <!-- Character List -->
  <div class="rounded-md border bg-muted/10">
    <ScrollArea class="h-72 w-full rounded-md p-2">
      {#if !characterVault.isLoaded}
        <div class="space-y-3 p-2">
          {#each Array(3) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="space-y-2">
                <Skeleton class="h-4 w-[150px]" />
                <Skeleton class="h-3 w-[100px]" />
              </div>
            </div>
          {/each}
        </div>
      {:else if filteredCharacters.length === 0}
        <div
          class="flex h-48 flex-col items-center justify-center p-4 text-center"
        >
          {#if filterType === "protagonist"}
            <User class="mb-2 h-8 w-8 text-muted-foreground/50" />
          {:else}
            <Users class="mb-2 h-8 w-8 text-muted-foreground/50" />
          {/if}
          <p class="text-sm text-muted-foreground">
            {#if searchQuery}
              No characters match your search
            {:else}
              {emptyMessage}
            {/if}
          </p>
          {#if !searchQuery && onNavigateToVault}
            <Button
              variant="outline"
              size="sm"
              class="mt-4"
              onclick={onNavigateToVault}
            >
              Go to Vault
            </Button>
          {/if}
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {#each filteredCharacters as character (character.id)}
            <button
              class={cn(
                "group relative flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected(character.id)
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-transparent bg-card shadow-sm hover:border-primary/20",
              )}
              onclick={() => handleSelect(character)}
            >
              <!-- Avatar -->
              <Avatar.Root class="h-10 w-10 border shadow-sm">
                <Avatar.Image
                  src={normalizeImageDataUrl(character.portrait) ?? ""}
                  alt={character.name}
                  class="object-cover"
                />
                <Avatar.Fallback class="bg-muted text-muted-foreground">
                  {#if character.characterType === "protagonist"}
                    <User class="h-5 w-5" />
                  {:else}
                    <Users class="h-5 w-5" />
                  {/if}
                </Avatar.Fallback>
              </Avatar.Root>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="truncate text-sm font-medium leading-none">
                    {character.name}
                  </h4>
                  {#if isSelected(character.id)}
                    <Badge variant="default" class="h-5 px-1.5 text-[10px]">
                      Selected
                    </Badge>
                  {/if}
                </div>
                <p class="mt-1 truncate text-xs text-muted-foreground">
                  {character.characterType === "protagonist"
                    ? "Protagonist"
                    : character.role || "Supporting"}
                </p>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </ScrollArea>
  </div>
</div>
