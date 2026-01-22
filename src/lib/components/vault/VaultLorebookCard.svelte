<script lang="ts">
  import type { VaultLorebook, EntryType } from '$lib/types';
  import { Star, Pencil, Trash2, Archive, Users, MapPin, Box, Flag, Brain, Calendar, Loader2, Book } from 'lucide-svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils/cn';

  interface Props {
    lorebook: VaultLorebook;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    selectable?: boolean;
    onSelect?: () => void;
  }

  let { lorebook, onEdit, onDelete, onToggleFavorite, selectable = false, onSelect }: Props = $props();

  let confirmingDelete = $state(false);
  let isImporting = $derived(lorebook.metadata?.importing === true);

  function handleCardClick() {
    if (isImporting) return;
    if (selectable && onSelect) {
      onSelect();
    }
  }

  function handleDelete(e: Event) {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
    confirmingDelete = false;
  }

  function handleCancelDelete(e: Event) {
    e.stopPropagation();
    confirmingDelete = false;
  }

  function handleConfirmDelete(e: Event) {
    e.stopPropagation();
    confirmingDelete = true;
  }

  // Icons for entry types
  const typeIcons: Record<EntryType, any> = {
    character: Users,
    location: MapPin,
    item: Box,
    faction: Flag,
    concept: Brain,
    event: Calendar,
  };

  // Helper to get non-zero entry counts
  const entryCounts = $derived.by(() => {
    if (!lorebook.metadata?.entryBreakdown) return [];
    return Object.entries(lorebook.metadata.entryBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({ type: type as EntryType, count }));
  });
</script>

<Card
  class={cn(
    "relative overflow-hidden transition-all group",
    selectable && !isImporting && "cursor-pointer hover:border-primary/50 hover:shadow-sm",
    selectable && !isImporting && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  )}
  onclick={handleCardClick}
  role={selectable && !isImporting ? "button" : undefined}
  tabindex={selectable && !isImporting ? 0 : undefined}
  onkeydown={selectable && !isImporting ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); } : undefined}
>
  {#if isImporting}
    <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="text-sm font-medium text-muted-foreground">Processing...</span>
    </div>
  {/if}

  <CardContent class="p-3">
    <div class="flex gap-3">
      <!-- Icon/Cover -->
      <div class="shrink-0">
        <div class="flex h-24 w-24 items-center justify-center rounded-md bg-muted ring-1 ring-border/50">
          <Book class="h-10 w-10 text-muted-foreground/50" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex justify-between items-start gap-2">
           <!-- Header info -->
           <div class="min-w-0">
              <h3 class="font-bold text-base leading-none truncate pr-1">{lorebook.name}</h3>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-[10px] text-muted-foreground font-medium">
                  {lorebook.entries.length} entries
                </span>
                {#if lorebook.source === 'story' || lorebook.source === 'import'}
                   <Badge variant="secondary" class="text-[10px] px-1.5 h-4 font-normal">
                      {lorebook.source === 'story' ? 'Story' : 'Imported'}
                   </Badge>
                {/if}
                {#if selectable && lorebook.favorite}
                   <Star class="h-3 w-3 text-yellow-500 fill-yellow-500" />
                {/if}
              </div>
           </div>

           <!-- Actions -->
           {#if !selectable && (onEdit || onDelete || onToggleFavorite)}
            <div class="flex items-center gap-0.5 -mt-1 -mr-1 shrink-0">
              {#if confirmingDelete}
                <div class="flex flex-col gap-1 items-end bg-background/95 backdrop-blur shadow-sm rounded-md p-1 absolute right-2 top-2 z-20 border border-border">
                   <span class="text-[10px] font-medium px-1 text-destructive">Delete?</span>
                   <div class="flex gap-1">
                      <Button variant="ghost" size="sm" class="h-6 px-2 text-[10px]" onclick={handleCancelDelete}>No</Button>
                      <Button variant="destructive" size="sm" class="h-6 px-2 text-[10px]" onclick={handleDelete}>Yes</Button>
                   </div>
                </div>
              {:else}
                {#if onToggleFavorite}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity"
                    onclick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                    title={lorebook.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star class="h-3.5 w-3.5 {lorebook.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}" />
                  </Button>
                {/if}
                {#if onEdit}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity"
                    onclick={(e) => { e.stopPropagation(); onEdit?.(); }}
                    title="Edit"
                  >
                    <Pencil class="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                {/if}
                {#if onDelete}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                    onclick={handleConfirmDelete}
                    title="Delete"
                  >
                    <Trash2 class="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                {/if}
              {/if}
            </div>
          {/if}
        </div>

        {#if lorebook.description}
          <p class="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{lorebook.description}</p>
        {/if}

        <!-- Entry Type Breakdown -->
        {#if entryCounts.length > 0}
          <div class="mt-auto pt-2 flex flex-wrap gap-1.5">
            {#each entryCounts.slice(0, 4) as { type, count }}
              {@const Icon = typeIcons[type]}
              <div class="flex items-center gap-1 text-[10px] text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded-sm border border-border/50" title="{type}">
                {#if Icon}
                  <Icon class="h-3 w-3 opacity-70" />
                {/if}
                <span>{count}</span>
              </div>
            {/each}
            {#if entryCounts.length > 4}
               <span class="text-[10px] text-muted-foreground self-center">+{entryCounts.length - 4}</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </CardContent>
</Card>
