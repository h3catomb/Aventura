<script lang="ts">
  import { story } from "$lib/stores/story.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import {
    Plus,
    Target,
    CheckCircle,
    XCircle,
    Circle,
    Pencil,
    ChevronDown,
    Save,
    X,
  } from "lucide-svelte";
  import type { StoryBeat } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import IconRow from "$lib/components/ui/icon-row.svelte";
  import { cn } from "$lib/utils/cn";

  let showAddForm = $state(false);
  let newTitle = $state("");
  let newDescription = $state("");
  let newType = $state<StoryBeat["type"]>("quest");
  let editingId = $state<string | null>(null);
  let editTitle = $state("");
  let editDescription = $state("");
  let editType = $state<StoryBeat["type"]>("quest");
  let editStatus = $state<StoryBeat["status"]>("pending");

  function toggleCollapse(beatId: string) {
    const isCollapsed = ui.isEntityCollapsed(beatId);
    ui.toggleEntityCollapsed(beatId, !isCollapsed);
  }

  async function addBeat() {
    if (!newTitle.trim()) return;
    await story.addStoryBeat(
      newTitle.trim(),
      newType,
      newDescription.trim() || undefined,
    );
    newTitle = "";
    newDescription = "";
    newType = "quest";
    showAddForm = false;
  }

  function startEdit(beat: StoryBeat) {
    editingId = beat.id;
    editTitle = beat.title;
    editDescription = beat.description ?? "";
    editType = beat.type;
    editStatus = beat.status;
  }

  function cancelEdit() {
    editingId = null;
    editTitle = "";
    editDescription = "";
    editType = "quest";
    editStatus = "pending";
  }

  async function saveEdit(beat: StoryBeat) {
    const title = editTitle.trim();
    if (!title) return;
    await story.updateStoryBeat(beat.id, {
      title,
      description: editDescription.trim() || null,
      type: editType,
      status: editStatus,
    });
    cancelEdit();
  }

  async function deleteBeat(beat: StoryBeat) {
    await story.deleteStoryBeat(beat.id);
  }

  type LucideIcon = typeof Circle;

  const STATUS_CONFIG: Record<
    StoryBeat["status"],
    { icon: LucideIcon; color: string; bgColor: string }
  > = {
    pending: {
      icon: Circle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50 ring-muted-foreground/30",
    },
    active: {
      icon: Target,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 ring-amber-500/50",
    },
    completed: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10 ring-green-500/40",
    },
    failed: {
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10 ring-destructive/40",
    },
  };

  function getStatusConfig(status: StoryBeat["status"]) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "milestone":
        return "Milestone";
      case "quest":
        return "Quest";
      case "revelation":
        return "Revelation";
      case "event":
        return "Event";
      case "plot_point":
        return "Plot Point";
      default:
        return type;
    }
  }
</script>

<div class="flex flex-col gap-1 pb-12">
  <!-- Header -->
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-xl font-bold tracking-tight text-foreground">Story Beats</h3>
    <Button
      variant="text"
      size="icon"
      class="h-6 w-6 text-muted-foreground hover:text-foreground"
      onclick={() => (showAddForm = !showAddForm)}
      title="Add story beat"
    >
      <Plus class="h-6! w-6!" />
    </Button>
  </div>

  <!-- Add Form -->
  {#if showAddForm}
    <div class="rounded-lg border border-border bg-card p-3 shadow-sm mb-2">
      <div class="space-y-3">
        <Input
          type="text"
          bind:value={newTitle}
          placeholder="Title"
          class="h-8 text-sm"
        />
        
        <Select.Root type="single" bind:value={newType}>
          <Select.Trigger class="h-8 text-xs w-full">
            <div class="flex items-center gap-2 overflow-hidden">
               <span class="truncate">{getTypeLabel(newType)}</span>
            </div>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="quest" label="Quest" />
            <Select.Item value="milestone" label="Milestone" />
            <Select.Item value="revelation" label="Revelation" />
            <Select.Item value="event" label="Event" />
            <Select.Item value="plot_point" label="Plot Point" />
          </Select.Content>
        </Select.Root>

        <Textarea
          bind:value={newDescription}
          placeholder="Description (optional)"
          class="resize-none text-sm min-h-15"
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
          onclick={addBeat}
          disabled={!newTitle.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  {/if}

  <!-- Active Quests -->
  {#if story.pendingQuests.length > 0}
    <div class="flex flex-col gap-2 mb-4">
      <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Active</h4>
      {#each story.pendingQuests as beat (beat.id)}
        {@const statusConfig = getStatusConfig(beat.status)}
        {@const isCollapsed = ui.isEntityCollapsed(beat.id)}
        {@const isEditing = editingId === beat.id}
        {@const description = beat.translatedDescription ?? beat.description}

        <div
          class={cn(
            "group rounded-lg border bg-card shadow-sm transition-all px-2.5 py-2",
            isEditing && "ring-1 ring-primary/20 border-border",
            !isEditing && beat.status === "pending" && "border-muted-foreground/20",
            !isEditing && beat.status === "active" && "border-amber-500/40",
          )}
        >
          {#if isEditing}
             <!-- EDIT MODE -->
             <div class="space-y-3">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Editing Beat
                </h4>
                <Button variant="text" size="icon" class="h-6 w-6" onclick={cancelEdit}>
                  <X class="h-4 w-4" />
                </Button>
              </div>

              <div class="space-y-2">
                <div class="space-y-1">
                  <Label class="text-xs">Title</Label>
                  <Input
                    type="text"
                    bind:value={editTitle}
                    placeholder="Title"
                    class="h-8 text-sm"
                  />
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <div class="space-y-1">
                    <Label class="text-xs">Type</Label>
                    <Select.Root type="single" bind:value={editType}>
                      <Select.Trigger class="h-8 text-xs w-full">
                         <div class="flex items-center gap-2 overflow-hidden">
                           <span class="truncate">{getTypeLabel(editType)}</span>
                        </div>
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="quest" label="Quest" />
                        <Select.Item value="milestone" label="Milestone" />
                        <Select.Item value="revelation" label="Revelation" />
                        <Select.Item value="event" label="Event" />
                        <Select.Item value="plot_point" label="Plot Point" />
                      </Select.Content>
                    </Select.Root>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs">Status</Label>
                    <Select.Root type="single" bind:value={editStatus}>
                      <Select.Trigger class="h-8 text-xs w-full">
                         <div class="flex items-center gap-2 overflow-hidden">
                           <span class="truncate capitalize">{editStatus}</span>
                        </div>
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="pending" label="Pending" />
                        <Select.Item value="active" label="Active" />
                        <Select.Item value="completed" label="Completed" />
                        <Select.Item value="failed" label="Failed" />
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>

                <div class="space-y-1">
                  <Label class="text-xs">Description</Label>
                  <Textarea
                    bind:value={editDescription}
                    placeholder="Description"
                    class="resize-none text-xs min-h-[60px]"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="text" size="sm" class="h-7 text-xs" onclick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  class="h-7 text-xs px-4"
                  onclick={() => saveEdit(beat)}
                  disabled={!editTitle.trim()}
                >
                  <Save class="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          {:else}
            <!-- DISPLAY MODE -->
            <div class="flex items-start gap-2.5">
              <!-- Status Icon -->
              <div
                class={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2",
                  statusConfig.bgColor,
                )}
              >
                <statusConfig.icon
                  class={cn("h-3.5 w-3.5", statusConfig.color)}
                />
              </div>

              <!-- Name & Badge -->
              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <span class="font-medium text-sm leading-tight text-foreground">
                  {beat.translatedTitle ?? beat.title}
                </span>
                <Badge
                  variant="secondary"
                  class="px-1.5 py-0 text-[10px] font-normal text-muted-foreground h-4 w-fit"
                >
                  {getTypeLabel(beat.type)}
                </Badge>
              </div>
            </div>

            <!-- Expanded Details -->
            {#if !isCollapsed && description}
              <div class="mt-2 text-xs text-muted-foreground">
                <p class="leading-relaxed whitespace-pre-wrap">{description}</p>
              </div>
            {/if}

            <!-- Footer Actions -->
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center -ml-1.5">
                {#if description}
                  <Button
                    variant="text"
                    size="icon"
                    class="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onclick={() => toggleCollapse(beat.id)}
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
                onDelete={() => deleteBeat(beat)}
                showDelete={true}
              >
                <Button
                  variant="text"
                  size="icon"
                  class="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onclick={() => startEdit(beat)}
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

  <!-- History / Empty State -->
  {#if story.storyBeats.length === 0 && story.pendingQuests.length === 0}
     <div class="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border bg-muted/20">
      <div class="mb-3 rounded-full bg-muted p-3">
        <Target class="h-6 w-6 text-muted-foreground" />
      </div>
      <p class="text-sm text-muted-foreground">No story beats yet</p>
      <Button
        variant="text"
        size="sm"
        class="mt-1 h-auto text-xs text-primary gap-1.5 hover:text-primary/80"
        onclick={() => (showAddForm = true)}
      >
        <Plus class="h-3.5 w-3.5" />
        Add your first beat
      </Button>
    </div>
  {:else}
     {@const completedBeats = story.storyBeats.filter(
        (b) => b.status === "completed" || b.status === "failed"
      )}
      
      {#if completedBeats.length > 0}
         <div class="flex flex-col gap-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">History</h4>
            {#each completedBeats as beat (beat.id)}
                {@const statusConfig = getStatusConfig(beat.status)}
                {@const isCollapsed = ui.isEntityCollapsed(beat.id)}
                {@const isEditing = editingId === beat.id}
                {@const description = beat.translatedDescription ?? beat.description}

                <div
                  class={cn(
                    "group rounded-lg border bg-card/50 shadow-sm transition-all px-2.5 py-2",
                    isEditing && "ring-1 ring-primary/20 border-border opacity-100",
                    !isEditing && "opacity-80 hover:opacity-100",
                    !isEditing && beat.status === "completed" && "border-green-500/30",
                    !isEditing && beat.status === "failed" && "border-destructive/30",
                  )}
                >
                  {#if isEditing}
                    <!-- EDIT MODE -->
                    <div class="space-y-3">
                      <div class="flex justify-between items-center mb-2">
                        <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Editing Beat
                        </h4>
                        <Button variant="text" size="icon" class="h-6 w-6" onclick={cancelEdit}>
                          <X class="h-4 w-4" />
                        </Button>
                      </div>

                      <div class="space-y-2">
                        <div class="space-y-1">
                          <Label class="text-xs">Title</Label>
                          <Input
                            type="text"
                            bind:value={editTitle}
                            placeholder="Title"
                            class="h-8 text-sm"
                          />
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                          <div class="space-y-1">
                            <Label class="text-xs">Type</Label>
                            <Select.Root type="single" bind:value={editType}>
                              <Select.Trigger class="h-8 text-xs w-full">
                                <div class="flex items-center gap-2 overflow-hidden">
                                  <span class="truncate">{getTypeLabel(editType)}</span>
                                </div>
                              </Select.Trigger>
                              <Select.Content>
                                <Select.Item value="quest" label="Quest" />
                                <Select.Item value="milestone" label="Milestone" />
                                <Select.Item value="revelation" label="Revelation" />
                                <Select.Item value="event" label="Event" />
                                <Select.Item value="plot_point" label="Plot Point" />
                              </Select.Content>
                            </Select.Root>
                          </div>
                          <div class="space-y-1">
                            <Label class="text-xs">Status</Label>
                            <Select.Root type="single" bind:value={editStatus}>
                              <Select.Trigger class="h-8 text-xs w-full">
                                <div class="flex items-center gap-2 overflow-hidden">
                                  <span class="truncate capitalize">{editStatus}</span>
                                </div>
                              </Select.Trigger>
                              <Select.Content>
                                <Select.Item value="pending" label="Pending" />
                                <Select.Item value="active" label="Active" />
                                <Select.Item value="completed" label="Completed" />
                                <Select.Item value="failed" label="Failed" />
                              </Select.Content>
                            </Select.Root>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <Label class="text-xs">Description</Label>
                          <Textarea
                            bind:value={editDescription}
                            placeholder="Description"
                            class="resize-none text-xs min-h-[60px]"
                          />
                        </div>
                      </div>

                      <div class="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button variant="text" size="sm" class="h-7 text-xs" onclick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          class="h-7 text-xs px-4"
                          onclick={() => saveEdit(beat)}
                          disabled={!editTitle.trim()}
                        >
                          <Save class="mr-1.5 h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  {:else}
                  <!-- DISPLAY MODE -->
                  <div class="flex items-start gap-2.5">
                    <!-- Status Icon -->
                    <div
                      class={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2",
                        statusConfig.bgColor,
                      )}
                    >
                      <statusConfig.icon
                        class={cn("h-3.5 w-3.5", statusConfig.color)}
                      />
                    </div>

                    <!-- Name & Badge -->
                    <div class="flex-1 min-w-0 flex flex-col gap-1">
                      <span
                        class={cn(
                          "font-medium text-sm leading-tight text-muted-foreground",
                          beat.status === "completed" && "line-through decoration-green-500/50",
                          beat.status === "failed" && "line-through decoration-destructive/50",
                        )}
                      >
                        {beat.translatedTitle ?? beat.title}
                      </span>
                      <Badge
                        variant="secondary"
                        class="px-1.5 py-0 text-[10px] font-normal text-muted-foreground h-4 w-fit"
                      >
                        {getTypeLabel(beat.type)}
                      </Badge>
                    </div>
                  </div>

                  <!-- Expanded Details -->
                  {#if !isCollapsed && description}
                    <div class="mt-2 text-xs text-muted-foreground">
                      <p class="leading-relaxed whitespace-pre-wrap">{description}</p>
                    </div>
                  {/if}

                  <!-- Footer Actions -->
                  <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center -ml-1.5">
                      {#if description}
                        <Button
                          variant="text"
                          size="icon"
                          class="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onclick={() => toggleCollapse(beat.id)}
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
                      onDelete={() => deleteBeat(beat)}
                      showDelete={true}
                    >
                      <Button
                        variant="text"
                        size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onclick={() => startEdit(beat)}
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
  {/if}
</div>
