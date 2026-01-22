<script lang="ts">
  import { tagStore } from "$lib/stores/tags.svelte";
  import type { VaultType } from "$lib/types";
  import { Filter, Check, X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { cn } from "$lib/utils/cn";

  interface Props {
    selectedTags: string[];
    logic: "AND" | "OR";
    type: VaultType;
    onUpdate: (tags: string[], logic: "AND" | "OR") => void;
  }

  let { selectedTags, logic, type, onUpdate }: Props = $props();

  let isOpen = $state(false);
  let search = $state("");

  const availableTags = $derived(tagStore.getTagsForType(type));

  const filteredTags = $derived.by(() => {
    if (!search.trim()) return availableTags;
    const q = search.toLowerCase();
    return availableTags.filter((t) => t.name.toLowerCase().includes(q));
  });

  function toggleTag(tagName: string) {
    if (selectedTags.includes(tagName)) {
      onUpdate(
        selectedTags.filter((t) => t !== tagName),
        logic,
      );
    } else {
      onUpdate([...selectedTags, tagName], logic);
    }
  }

  function clearTags() {
    onUpdate([], logic);
    isOpen = false;
  }

  function toggleLogic() {
    onUpdate(selectedTags, logic === "AND" ? "OR" : "AND");
  }

  // Close dropdown on click outside
  function handleClickOutside(node: HTMLElement) {
    const handleClick = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) {
        isOpen = false;
      }
    };
    document.addEventListener("click", handleClick);
    return {
      destroy() {
        document.removeEventListener("click", handleClick);
      },
    };
  }
</script>

<div class="relative z-20" use:handleClickOutside>
  <Button
    variant={selectedTags.length > 0 ? "secondary" : "outline"}
    size="sm"
    class={cn("gap-2", selectedTags.length > 0 && "bg-secondary text-secondary-foreground")}
    onclick={() => (isOpen = !isOpen)}
  >
    <Filter class="h-3 w-3" />
    <span class="hidden sm:inline">Tags</span>
    {#if selectedTags.length > 0}
      <Badge variant="secondary" class="ml-1 h-5 px-1.5 text-[10px]">
        {selectedTags.length}
      </Badge>
    {/if}
  </Button>

  {#if isOpen}
    <!-- Mobile Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden"
      transition:fade={{ duration: 100 }}
      onclick={() => (isOpen = false)}
      aria-hidden="true"
    ></div>

    <div
      transition:fade={{ duration: 100 }}
      class="
        fixed left-1/2 top-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 shadow-lg
        sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:translate-x-0 sm:translate-y-0
        rounded-xl border bg-popover p-3 text-popover-foreground
      "
    >
      <!-- Header / Logic Toggle -->
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">Filter Logic:</span>
        <div class="flex items-center rounded-md bg-muted p-0.5">
          <button
            class={cn(
              "rounded-sm px-2 py-0.5 text-[10px] font-bold transition-all",
              logic === "AND"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onclick={toggleLogic}
          >
            AND
          </button>
          <button
            class={cn(
              "rounded-sm px-2 py-0.5 text-[10px] font-bold transition-all",
              logic === "OR"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onclick={toggleLogic}
          >
            OR
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-2">
        <Input
          type="text"
          bind:value={search}
          placeholder="Filter tags..."
          class="h-8 text-xs"
        />
      </div>

      <!-- Tag List -->
      <div class="max-h-48 space-y-1 overflow-y-auto pr-1">
        {#each filteredTags as tag}
          <button
            class={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
              selectedTags.includes(tag.name)
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onclick={() => toggleTag(tag.name)}
          >
            <div class="flex items-center gap-2">
              <span>{tag.name}</span>
            </div>
            {#if selectedTags.includes(tag.name)}
              <Check class="h-3 w-3" />
            {/if}
          </button>
        {/each}
        {#if filteredTags.length === 0}
          <div class="py-2 text-center text-xs text-muted-foreground">
            No tags found
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if selectedTags.length > 0}
        <div class="mt-2 border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-full text-xs text-muted-foreground hover:text-foreground"
            onclick={clearTags}
          >
            <X class="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>
