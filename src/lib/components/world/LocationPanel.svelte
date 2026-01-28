<script lang="ts">
  import { story } from "$lib/stores/story.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import {
    Plus,
    MapPin,
    Navigation,
    Pencil,
    ChevronDown,
    Save,
    X,
  } from "lucide-svelte";
  import type { Location } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import { cn } from "$lib/utils/cn";
  import IconRow from "$lib/components/ui/icon-row.svelte";

  let showAddForm = $state(false);
  let newName = $state("");
  let newDescription = $state("");
  let editingId = $state<string | null>(null);
  let editName = $state("");
  let editDescription = $state("");

  function toggleCollapse(locationId: string) {
    const isCollapsed = ui.isEntityCollapsed(locationId);
    ui.toggleEntityCollapsed(locationId, !isCollapsed);
  }

  function hasDetails(location: Location): boolean {
    return !!location.description;
  }

  async function addLocation() {
    if (!newName.trim()) return;
    const makeCurrent = story.locations.length === 0;
    await story.addLocation(
      newName.trim(),
      newDescription.trim() || undefined,
      makeCurrent,
    );
    newName = "";
    newDescription = "";
    showAddForm = false;
  }

  async function goToLocation(locationId: string) {
    await story.setCurrentLocation(locationId);
  }

  async function toggleVisited(locationId: string) {
    await story.toggleLocationVisited(locationId);
  }

  async function deleteLocation(location: Location) {
    await story.deleteLocation(location.id);
  }

  function startEdit(location: Location) {
    editingId = location.id;
    editName = location.name;
    editDescription = location.description ?? "";
  }

  function cancelEdit() {
    editingId = null;
    editName = "";
    editDescription = "";
  }

  async function saveEdit(location: Location) {
    const name = editName.trim();
    if (!name) return;
    await story.updateLocation(location.id, {
      name,
      description: editDescription.trim() || null,
    });
    cancelEdit();
  }
</script>

<div class="flex flex-col gap-1 pb-12">
  <!-- Header -->
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-xl font-bold tracking-tight text-foreground">Locations</h3>
    <Button
      variant="text"
      size="icon"
      class="h-6 w-6 text-muted-foreground hover:text-foreground"
      onclick={() => (showAddForm = !showAddForm)}
      title="Add location"
    >
      <Plus class="h-6! w-6!" />
    </Button>
  </div>

  <!-- Add Form -->
  {#if showAddForm}
    <div class="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="space-y-3">
        <Input
          type="text"
          bind:value={newName}
          placeholder="Location name"
          class="h-8 text-sm"
        />
        <Textarea
          bind:value={newDescription}
          placeholder="Description (optional)"
          class="resize-none text-sm min-h-[60px]"
          rows={2}
        />
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <Button
          variant="text"
          size="sm"
          class="h-7"
          onclick={() => (showAddForm = false)}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          class="h-7"
          onclick={addLocation}
          disabled={!newName.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  {/if}

  <!-- Current Location -->
  {#if story.currentLocation}
    {@const currentLocation = story.currentLocation}
    {@const isEditing = editingId === currentLocation.id}
    {@const isCollapsed = ui.isEntityCollapsed(currentLocation.id)}

    <div
      class={cn(
        "rounded-lg border bg-accent-500/5 shadow-sm px-2.5 py-2 mb-2",
        isEditing ? "ring-1 ring-primary/20 border-border" : "border-accent-500/50",
      )}
    >
      {#if isEditing}
        <!-- EDIT MODE (Current) -->
        <div class="space-y-3">
          <div class="flex justify-between items-center mb-2">
            <h4
              class="text-xs font-semibold text-accent-400 uppercase tracking-wider"
            >
              Editing Current Location
            </h4>
            <Button
              variant="text"
              size="icon"
              class="h-6 w-6"
              onclick={cancelEdit}><X class="h-4 w-4" /></Button
            >
          </div>

          <div class="space-y-1">
            <Input
              type="text"
              bind:value={editName}
              placeholder="Location name"
              class="h-8 text-sm"
            />
          </div>

          <div class="space-y-1">
            <Textarea
              bind:value={editDescription}
              placeholder="Description"
              class="resize-none text-xs min-h-[60px]"
            />
          </div>

          <div
            class="flex justify-end gap-2 pt-2 border-t border-accent-500/30"
          >
            <Button
              variant="text"
              size="sm"
              class="h-7 text-xs"
              onclick={cancelEdit}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              class="h-7 text-xs px-4"
              onclick={() => saveEdit(currentLocation)}
              disabled={!editName.trim()}
            >
              <Save class="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      {:else}
        <!-- DISPLAY MODE (Current) -->
        <div class="flex items-start gap-2.5">
          <!-- Current Location Icon -->
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 bg-accent-500/20 ring-accent-500/50"
          >
            <Navigation class="h-3.5 w-3.5 text-accent-500" />
          </div>

          <!-- Name & Badge -->
          <div class="flex-1 min-w-0 flex flex-col gap-1">
            <span class="font-medium text-sm leading-tight text-foreground">
              {currentLocation.translatedName ?? currentLocation.name}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-accent-500 w-fit">
              Current Location
            </span>
          </div>
        </div>

        <!-- Expanded Details -->
        {#if !isCollapsed && (currentLocation.description || currentLocation.translatedDescription)}
          <div class="mt-2 text-xs text-muted-foreground">
            <p class="leading-relaxed whitespace-pre-wrap">
              {currentLocation.translatedDescription ?? currentLocation.description}
            </p>
          </div>
        {/if}

        <!-- Footer Actions -->
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center -ml-1.5">
            {#if currentLocation.description || currentLocation.translatedDescription}
              <Button
                variant="text"
                size="icon"
                class="h-6 w-6 text-accent-500 hover:text-accent-600"
                onclick={() => toggleCollapse(currentLocation.id)}
                title={isCollapsed ? "Show details" : "Hide details"}
              >
                <ChevronDown
                  class={cn(
                    "h-4 w-4 transition-transform duration-200",
                    !isCollapsed ? "rotate-180" : "",
                  )}
                />
              </Button>
            {/if}
          </div>

          <div class="flex items-center gap-0.5 -mr-1.5">
            <Button
              variant="text"
              size="icon"
              class="h-6 w-6 text-accent-500 hover:text-accent-600"
              onclick={() => startEdit(currentLocation)}
              title="Edit location"
            >
              <Pencil class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Location List -->
  {#if story.locations.filter((l) => !l.current).length === 0 && !story.currentLocation}
    <div
      class="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border bg-muted/20"
    >
      <div class="mb-3 rounded-full bg-muted p-3">
        <MapPin class="h-6 w-6 text-muted-foreground" />
      </div>
      <p class="text-sm text-muted-foreground">No locations yet</p>
      <Button
        variant="link"
        class="mt-1 h-auto p-0 text-xs text-primary"
        onclick={() => (showAddForm = true)}
      >
        <Plus class="mr-1.5 h-3.5 w-3.5" />
        Add your first location
      </Button>
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      {#each story.locations.filter((l) => !l.current) as location (location.id)}
        {@const isCollapsed = ui.isEntityCollapsed(location.id)}
        {@const isEditing = editingId === location.id}

        <div
          class={cn(
            "group rounded-lg border bg-card shadow-sm transition-all px-2.5 py-2",
            isEditing && "ring-1 ring-primary/20 border-border",
            !isEditing && location.visited && "border-muted-foreground/20",
            !isEditing && !location.visited && "border-primary/30",
          )}
        >
          {#if isEditing}
            <!-- EDIT MODE -->
            <div class="space-y-3">
              <div class="flex justify-between items-center mb-2">
                <h4
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Editing {location.name}
                </h4>
                <Button
                  variant="text"
                  size="icon"
                  class="h-6 w-6"
                  onclick={cancelEdit}><X class="h-4 w-4" /></Button
                >
              </div>

              <div class="space-y-1">
                <Label class="text-xs">Name</Label>
                <Input
                  type="text"
                  bind:value={editName}
                  placeholder="Location name"
                  class="h-8 text-sm"
                />
              </div>

              <div class="space-y-1">
                <Label class="text-xs">Description</Label>
                <Textarea
                  bind:value={editDescription}
                  placeholder="Description"
                  class="resize-none text-xs min-h-[60px]"
                />
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="text"
                  size="sm"
                  class="h-7 text-xs"
                  onclick={cancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  class="h-7 text-xs px-4"
                  onclick={() => saveEdit(location)}
                  disabled={!editName.trim()}
                >
                  <Save class="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </Button>
              </div>
            </div>
          {:else}
            <!-- DISPLAY MODE -->
            <div class="flex items-start gap-2.5">
              <!-- Visited Status Icon -->
              <button
                class={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2 transition-colors",
                  location.visited
                    ? "bg-muted/50 ring-muted-foreground/30 text-muted-foreground hover:bg-muted"
                    : "bg-primary/10 ring-primary/50 text-primary hover:bg-primary/20",
                )}
                onclick={() => toggleVisited(location.id)}
                title={location.visited
                  ? "Mark as unvisited"
                  : "Mark as visited"}
              >
                <MapPin class={cn("h-3.5 w-3.5", location.visited && "opacity-60")} />
              </button>

              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <span
                  class={cn(
                    "font-medium text-sm leading-tight",
                    location.visited ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {location.translatedName ?? location.name}
                </span>
                <span
                  class={cn(
                    "text-[10px] font-medium uppercase tracking-wider w-fit",
                    location.visited ? "text-muted-foreground/70" : "text-primary",
                  )}
                >
                  {location.visited ? "Visited" : "Unvisited"}
                </span>
              </div>
            </div>

            <!-- Description (Expanded) -->
            {#if !isCollapsed && (location.description || location.translatedDescription)}
              <div class="mt-2 text-xs text-muted-foreground">
                <p class="leading-relaxed whitespace-pre-wrap">
                  {location.translatedDescription ?? location.description}
                </p>
              </div>
            {/if}

            <!-- Footer Actions -->
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center -ml-1.5">
                {#if location.description || location.translatedDescription}
                  <Button
                    variant="text"
                    size="icon"
                    class="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onclick={() => toggleCollapse(location.id)}
                    title={isCollapsed ? "Show details" : "Hide details"}
                  >
                    <ChevronDown
                      class={cn(
                        "h-4 w-4 transition-transform duration-200",
                        !isCollapsed ? "rotate-180" : "",
                      )}
                    />
                  </Button>
                {/if}
              </div>

              <IconRow
                class="-mr-1.5"
                onDelete={() => deleteLocation(location)}
                showDelete={true}
              >
                <Button
                  variant="text"
                  size="sm"
                  class="h-6 text-xs text-muted-foreground hover:text-primary"
                  onclick={() => goToLocation(location.id)}
                  title="Travel to location"
                >
                  <Navigation class="mr-1 h-3 w-3" />
                  Travel
                </Button>
                <Button
                  variant="text"
                  size="icon"
                  class="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onclick={() => startEdit(location)}
                  title="Edit"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </Button>
              </IconRow>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
