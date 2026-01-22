<script lang="ts">
  import { characterVault } from "$lib/stores/characterVault.svelte";
  import { lorebookVault } from "$lib/stores/lorebookVault.svelte";
  import { scenarioVault } from "$lib/stores/scenarioVault.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import type {
    VaultCharacter,
    VaultCharacterType,
    VaultLorebook,
    VaultScenario,
  } from "$lib/types";
  import {
    Plus,
    Search as SearchIcon,
    Star,
    User,
    Users,
    ChevronLeft,
    Upload,
    Archive,
    Book,
    Globe,
    MapPin,
    Tags,
  } from "lucide-svelte";
  import VaultCharacterCard from "./VaultCharacterCard.svelte";
  import VaultCharacterForm from "./VaultCharacterForm.svelte";
  import VaultLorebookCard from "./VaultLorebookCard.svelte";
  import VaultLorebookEditor from "./VaultLorebookEditor.svelte";
  import VaultScenarioCard from "./VaultScenarioCard.svelte";
  import VaultScenarioEditor from "./VaultScenarioEditor.svelte";
  import DiscoveryModal from "$lib/components/discovery/DiscoveryModal.svelte";
  import TagFilter from "./TagFilter.svelte";
  import TagManager from "$lib/components/tags/TagManager.svelte";
  import { tagStore } from "$lib/stores/tags.svelte";
  import { fade } from "svelte/transition";

  // Shadcn Components
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "$lib/components/ui/tabs";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { cn } from "$lib/utils/cn";

  // Types
  type VaultTab = "characters" | "lorebooks" | "scenarios";

  // State
  let activeTab = $state<VaultTab>(ui.vaultTab);
  let searchQuery = $state("");
  let showFavoritesOnly = $state(false);
  let selectedTags = $state<string[]>([]);
  let filterLogic = $state<"AND" | "OR">("OR");
  let showTagManager = $state(false);

  // Character State
  let charFilterType = $state<VaultCharacterType | "all">("all");
  let showCharForm = $state(false);
  let editingCharacter = $state<VaultCharacter | null>(null);
  let defaultCharFormType = $state<VaultCharacterType>("protagonist");
  let importCharError = $state<string | null>(null);

  // Lorebook State
  let importLorebookError = $state<string | null>(null);
  let editingLorebook = $state<VaultLorebook | null>(null);

  // Scenario State
  let importScenarioError = $state<string | null>(null);
  let editingScenario = $state<VaultScenario | null>(null);

  // Discovery Modal State
  let showDiscoveryModal = $state(false);
  let discoveryMode = $state<"character" | "lorebook" | "scenario">(
    "character",
  );

  // Derived: Filtered Characters
  const filteredCharacters = $derived.by(() => {
    let chars = characterVault.characters;

    if (charFilterType !== "all") {
      chars = chars.filter((c) => c.characterType === charFilterType);
    }

    if (showFavoritesOnly) {
      chars = chars.filter((c) => c.favorite);
    }

    if (selectedTags.length > 0) {
      if (filterLogic === "AND") {
        chars = chars.filter((c) =>
          selectedTags.every((tag) => c.tags.includes(tag)),
        );
      } else {
        chars = chars.filter((c) =>
          selectedTags.some((tag) => c.tags.includes(tag)),
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query)) ||
          c.traits.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return chars;
  });

  // Derived: Filtered Lorebooks
  const filteredLorebooks = $derived.by(() => {
    let books = lorebookVault.lorebooks;

    if (showFavoritesOnly) {
      books = books.filter((b) => b.favorite);
    }

    if (selectedTags.length > 0) {
      if (filterLogic === "AND") {
        books = books.filter((b) =>
          selectedTags.every((tag) => b.tags.includes(tag)),
        );
      } else {
        books = books.filter((b) =>
          selectedTags.some((tag) => b.tags.includes(tag)),
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      books = books.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return books;
  });

  // Derived: Filtered Scenarios
  const filteredScenarios = $derived.by(() => {
    let items = scenarioVault.scenarios;

    if (showFavoritesOnly) {
      items = items.filter((s) => s.favorite);
    }

    if (selectedTags.length > 0) {
      if (filterLogic === "AND") {
        items = items.filter((s) =>
          selectedTags.every((tag) => s.tags.includes(tag)),
        );
      } else {
        items = items.filter((s) =>
          selectedTags.some((tag) => s.tags.includes(tag)),
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return items;
  });

  // Load on mount
  $effect(() => {
    if (!characterVault.isLoaded) characterVault.load();
    if (!lorebookVault.isLoaded) lorebookVault.load();
    if (!scenarioVault.isLoaded) scenarioVault.load();
    if (!tagStore.isLoaded) tagStore.load();
  });

  // Sync with UI store
  $effect(() => {
    activeTab = ui.vaultTab;
    selectedTags = []; // Reset tags when tab changes externally
  });

  // Update UI store when tab changes
  $effect(() => {
    ui.setVaultTab(activeTab);
    selectedTags = []; // Reset tags when tab changes internally
  });

  // Character Handlers
  function openCreateCharForm(type: VaultCharacterType = "protagonist") {
    editingCharacter = null;
    defaultCharFormType = type;
    showCharForm = true;
  }

  function openEditCharForm(character: VaultCharacter) {
    editingCharacter = character;
    showCharForm = true;
  }

  async function handleDeleteChar(id: string) {
    await characterVault.delete(id);
  }

  async function handleToggleFavoriteChar(id: string) {
    await characterVault.toggleFavorite(id);
  }

  async function handleImportCard(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Fire and forget (store handles loading state via placeholder)
    try {
      await characterVault.importFromFile(file);
    } catch (error) {
      console.error("[CharacterVault] Import failed:", error);
      importCharError =
        error instanceof Error
          ? error.message
          : "Failed to import character card";
    } finally {
      input.value = "";
    }
  }

  // Lorebook Handlers
  async function handleImportLorebook(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Fire and forget (store handles loading state via placeholder)
    try {
      await lorebookVault.importFromFile(file);
    } catch (error) {
      console.error("[VaultPanel] Lorebook import failed:", error);
      importLorebookError =
        error instanceof Error ? error.message : "Failed to import lorebook";
    } finally {
      input.value = "";
    }
  }

  async function handleDeleteLorebook(id: string) {
    await lorebookVault.delete(id);
  }

  async function handleToggleFavoriteLorebook(id: string) {
    await lorebookVault.toggleFavorite(id);
  }

  function openEditLorebook(lorebook: VaultLorebook) {
    editingLorebook = lorebook;
  }

  async function handleCreateLorebook() {
    // Create a new empty lorebook and open it for editing
    const newLorebook = await lorebookVault.add({
      name: "",
      description: null,
      entries: [],
      tags: [],
      favorite: false,
      source: "manual",
      originalFilename: null,
      originalStoryId: null,
      metadata: {
        format: "aventura",
        totalEntries: 0,
        entryBreakdown: {
          character: 0,
          location: 0,
          item: 0,
          faction: 0,
          concept: 0,
          event: 0,
        },
      },
    });
    editingLorebook = newLorebook;
  }

  // Scenario Handlers
  async function handleImportScenario(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await scenarioVault.importFromFile(file);
    } catch (error) {
      console.error("[VaultPanel] Scenario import failed:", error);
      importScenarioError =
        error instanceof Error ? error.message : "Failed to import scenario";
    } finally {
      input.value = "";
    }
  }

  async function handleDeleteScenario(id: string) {
    await scenarioVault.delete(id);
  }

  async function handleToggleFavoriteScenario(id: string) {
    await scenarioVault.toggleFavorite(id);
  }

  function openEditScenario(scenario: VaultScenario) {
    editingScenario = scenario;
  }

  function openBrowseOnline(mode: "character" | "lorebook" | "scenario") {
    discoveryMode = mode;
    showDiscoveryModal = true;
  }
</script>

<Tabs
  value={activeTab}
  onValueChange={(v) => (activeTab = v as VaultTab)}
  class="flex h-full flex-col bg-background"
>
  <!-- Header -->
  <div class="flex flex-col border-b bg-muted/20">
    <!-- Top Bar -->
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-1">
        <Button
          variant="link"
          size="icon"
          class="-ml-2 h-9 w-9 text-muted-foreground hover:text-foreground"
          onclick={() => ui.setActivePanel("library")}
          title="Back to Library"
        >
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="flex items-center gap-2">
          <Archive class="h-5 w-5 text-muted-foreground" />
          <h2 class="text-lg font-semibold tracking-tight">Vault</h2>
        </div>
      </div>

      <!-- Right Side Actions -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-9 hidden sm:flex"
          onclick={() => (showTagManager = true)}
        >
          <Tags class="h-4 w-4" />
          Tags
        </Button>
        <!-- Mobile only icon button -->
        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9 sm:hidden"
          onclick={() => (showTagManager = true)}
        >
          <Tags class="h-4 w-4" />
        </Button>

        {#if activeTab === "characters"}
          <Button
            variant="outline"
            size="sm"
            class="h-9 hidden sm:flex"
            onclick={() => openBrowseOnline("character")}
          >
            <Globe class="h-4 w-4" />
            Browse Online
          </Button>

          <div class="relative">
            <Button
              variant="outline"
              size="sm"
              class="h-9 cursor-pointer hidden sm:flex"
            >
              <Upload class="h-4 w-4" />
              Import Card
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 cursor-pointer sm:hidden"
            >
              <Upload class="h-4 w-4" />
            </Button>
            <input
              type="file"
              accept=".json,.png"
              class="absolute inset-0 cursor-pointer opacity-0"
              onchange={handleImportCard}
            />
          </div>

          <Button size="sm" class="h-9" onclick={() => openCreateCharForm()}>
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">New Character</span>
            <span class="sm:hidden">New</span>
          </Button>
        {:else if activeTab === "lorebooks"}
          <Button
            variant="outline"
            size="sm"
            class="h-9 hidden sm:flex"
            onclick={() => openBrowseOnline("lorebook")}
          >
            <Globe class="h-4 w-4" />
            Browse Online
          </Button>

          <div class="relative">
            <Button
              variant="outline"
              size="sm"
              class="h-9 cursor-pointer hidden sm:flex"
            >
              <Upload class="h-4 w-4" />
              Import Lorebook
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 cursor-pointer sm:hidden"
            >
              <Upload class="h-4 w-4" />
            </Button>
            <input
              type="file"
              accept=".json,application/json"
              class="absolute inset-0 cursor-pointer opacity-0"
              onchange={handleImportLorebook}
            />
          </div>

          <Button size="sm" class="h-9" onclick={handleCreateLorebook}>
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">New Lorebook</span>
            <span class="sm:hidden">New</span>
          </Button>
        {:else if activeTab === "scenarios"}
          <Button
            variant="outline"
            size="sm"
            class="h-9 hidden sm:flex"
            onclick={() => openBrowseOnline("scenario")}
          >
            <Globe class="h-4 w-4" />
            Browse Online
          </Button>

          <div class="relative">
            <Button
              variant="outline"
              size="sm"
              class="h-9 cursor-pointer hidden sm:flex"
            >
              <Upload class="h-4 w-4" />
              Import Card
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 cursor-pointer sm:hidden"
            >
              <Upload class="h-4 w-4" />
            </Button>
            <input
              type="file"
              accept=".json,.png"
              class="absolute inset-0 cursor-pointer opacity-0"
              onchange={handleImportScenario}
            />
          </div>
        {/if}
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="px-4 pb-2">
      <TabsList class="grid w-full grid-cols-3 max-w-md bg-muted/50">
        <TabsTrigger value="characters" class="flex items-center gap-2">
          <Users class="h-4 w-4" />
          <span class="hidden sm:inline">Characters</span>
          <Badge variant="secondary" class="ml-1 px-1 py-0 h-5 text-[10px]"
            >{characterVault.characters.length}</Badge
          >
        </TabsTrigger>
        <TabsTrigger value="lorebooks" class="flex items-center gap-2">
          <Book class="h-4 w-4" />
          <span class="hidden sm:inline">Lorebooks</span>
          <Badge variant="secondary" class="ml-1 px-1 py-0 h-5 text-[10px]"
            >{lorebookVault.lorebooks.length}</Badge
          >
        </TabsTrigger>
        <TabsTrigger value="scenarios" class="flex items-center gap-2">
          <MapPin class="h-4 w-4" />
          <span class="hidden sm:inline">Scenarios</span>
          <Badge variant="secondary" class="ml-1 px-1 py-0 h-5 text-[10px]"
            >{scenarioVault.scenarios.length}</Badge
          >
        </TabsTrigger>
      </TabsList>
    </div>
  </div>

  <!-- Search and Filters -->
  <div
    class="flex flex-col gap-3 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <!-- Errors -->
    {#if activeTab === "characters" && importCharError}
      <div
        class="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <span>{importCharError}</span>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive"
          onclick={() => (importCharError = null)}
        >
          <span class="sr-only">Dismiss</span>
          &times;
        </Button>
      </div>
    {/if}

    {#if activeTab === "lorebooks" && importLorebookError}
      <div
        class="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <span>{importLorebookError}</span>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive"
          onclick={() => (importLorebookError = null)}
        >
          <span class="sr-only">Dismiss</span>
          &times;
        </Button>
      </div>
    {/if}

    {#if activeTab === "scenarios" && importScenarioError}
      <div
        class="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <span>{importScenarioError}</span>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive"
          onclick={() => (importScenarioError = null)}
        >
          <span class="sr-only">Dismiss</span>
          &times;
        </Button>
      </div>
    {/if}

    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <SearchIcon
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="text"
          bind:value={searchQuery}
          placeholder={activeTab === "characters"
            ? "Search characters..."
            : activeTab === "lorebooks"
              ? "Search lorebooks..."
              : "Search scenarios..."}
          class="pl-9 bg-muted/40"
        />
      </div>

      <div
        class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar"
      >
        {#if activeTab === "characters"}
          <div class="flex items-center rounded-lg border bg-muted p-1">
            <Button
              variant={charFilterType === "all" ? "secondary" : "ghost"}
              size="sm"
              class="h-7 px-3 text-xs"
              onclick={() => (charFilterType = "all")}
            >
              All
            </Button>
            <Button
              variant={charFilterType === "protagonist" ? "secondary" : "ghost"}
              size="sm"
              class="h-7 px-3 text-xs gap-1.5"
              onclick={() => (charFilterType = "protagonist")}
            >
              <User class="h-3 w-3" />
              Protagonists
            </Button>
            <Button
              variant={charFilterType === "supporting" ? "secondary" : "ghost"}
              size="sm"
              class="h-7 px-3 text-xs gap-1.5"
              onclick={() => (charFilterType = "supporting")}
            >
              <Users class="h-3 w-3" />
              Supporting
            </Button>
          </div>
        {/if}

        <TagFilter
          {selectedTags}
          logic={filterLogic}
          type={activeTab === "characters"
            ? "character"
            : activeTab === "lorebooks"
              ? "lorebook"
              : "scenario"}
          onUpdate={(tags, logic) => {
            selectedTags = tags;
            filterLogic = logic;
          }}
        />

        <Button
          variant={showFavoritesOnly ? "outline" : "outline"}
          size="sm"
          class={cn(
            "gap-1.5 transition-all",
            showFavoritesOnly &&
              "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 hover:text-yellow-700",
          )}
          onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
        >
          <Star
            class={cn(
              "h-3 w-3",
              showFavoritesOnly && "fill-yellow-500 text-yellow-500",
            )}
          />
          <span class="hidden sm:inline">Favorites</span>
        </Button>
      </div>
    </div>
  </div>

  <!-- Content -->
  <TabsContent
    value="characters"
    class="flex-1 overflow-hidden m-0 p-0 outline-none data-[state=inactive]:hidden"
  >
    <ScrollArea class="h-full">
      <div class="px-4 py-1">
        {#if !characterVault.isLoaded}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each Array(6) as _}
              <div class="space-y-3">
                <Skeleton class="h-[200px] w-full rounded-xl" />
                <div class="space-y-2">
                  <Skeleton class="h-4 w-[250px]" />
                  <Skeleton class="h-4 w-[200px]" />
                </div>
              </div>
            {/each}
          </div>
        {:else if filteredCharacters.length === 0}
          <div
            class="flex h-[50vh] flex-col items-center justify-center text-center"
            in:fade
          >
            <div class="rounded-full bg-muted p-4">
              <Users class="h-10 w-10 text-muted-foreground" />
            </div>
            <p class="mt-4 text-lg font-medium text-foreground">
              {#if searchQuery || showFavoritesOnly || charFilterType !== "all"}
                No characters match your filters
              {:else}
                No characters in vault yet
              {/if}
            </p>
            {#if !searchQuery && !showFavoritesOnly && charFilterType === "all"}
              <div class="mt-6 flex gap-3">
                <Button onclick={() => openCreateCharForm("protagonist")}>
                  <User class="h-4 w-4" />
                  Create Protagonist
                </Button>
                <Button
                  variant="outline"
                  onclick={() => openCreateCharForm("supporting")}
                >
                  <Users class="h-4 w-4" />
                  Create Supporting
                </Button>
              </div>
            {/if}
          </div>
        {:else}
          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            in:fade
          >
            {#each filteredCharacters as character (character.id)}
              <VaultCharacterCard
                {character}
                onEdit={() => openEditCharForm(character)}
                onDelete={() => handleDeleteChar(character.id)}
                onToggleFavorite={() => handleToggleFavoriteChar(character.id)}
              />
            {/each}
          </div>
        {/if}
      </div>
    </ScrollArea>
  </TabsContent>

  <TabsContent
    value="lorebooks"
    class="flex-1 overflow-hidden m-0 p-0 outline-none data-[state=inactive]:hidden"
  >
    <ScrollArea class="h-full">
      <div class="p-4 sm:p-6">
        {#if !lorebookVault.isLoaded}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each Array(6) as _}
              <Skeleton class="h-[150px] w-full rounded-xl" />
            {/each}
          </div>
        {:else if filteredLorebooks.length === 0}
          <div
            class="flex h-[50vh] flex-col items-center justify-center text-center"
            in:fade
          >
            <div class="rounded-full bg-muted p-4">
              <Book class="h-10 w-10 text-muted-foreground" />
            </div>
            <p class="mt-4 text-lg font-medium text-foreground">
              {#if searchQuery || showFavoritesOnly}
                No lorebooks match your filters
              {:else}
                No lorebooks in vault yet
              {/if}
            </p>
            <p class="mt-2 text-muted-foreground">
              Create a new lorebook or import one from a file
            </p>
            {#if !searchQuery && !showFavoritesOnly}
              <div class="mt-6">
                <Button onclick={handleCreateLorebook}>
                  <Plus class="h-4 w-4" />
                  Create Lorebook
                </Button>
              </div>
            {/if}
          </div>
        {:else}
          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            in:fade
          >
            {#each filteredLorebooks as lorebook (lorebook.id)}
              <VaultLorebookCard
                {lorebook}
                onDelete={() => handleDeleteLorebook(lorebook.id)}
                onToggleFavorite={() =>
                  handleToggleFavoriteLorebook(lorebook.id)}
                onEdit={() => openEditLorebook(lorebook)}
              />
            {/each}
          </div>
        {/if}
      </div>
    </ScrollArea>
  </TabsContent>

  <TabsContent
    value="scenarios"
    class="flex-1 overflow-hidden m-0 p-0 outline-none data-[state=inactive]:hidden"
  >
    <ScrollArea class="h-full">
      <div class="p-4 sm:p-6">
        {#if !scenarioVault.isLoaded}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each Array(6) as _}
              <Skeleton class="h-[150px] w-full rounded-xl" />
            {/each}
          </div>
        {:else if filteredScenarios.length === 0}
          <div
            class="flex h-[50vh] flex-col items-center justify-center text-center"
            in:fade
          >
            <div class="rounded-full bg-muted p-4">
              <MapPin class="h-10 w-10 text-muted-foreground" />
            </div>
            <p class="mt-4 text-lg font-medium text-foreground">
              {#if searchQuery || showFavoritesOnly}
                No scenarios match your filters
              {:else}
                No scenarios in vault yet
              {/if}
            </p>
            <p class="mt-2 text-muted-foreground">
              Import character cards to extract scenario settings
            </p>
          </div>
        {:else}
          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            in:fade
          >
            {#each filteredScenarios as scenario (scenario.id)}
              <VaultScenarioCard
                {scenario}
                onDelete={() => handleDeleteScenario(scenario.id)}
                onToggleFavorite={() =>
                  handleToggleFavoriteScenario(scenario.id)}
                onEdit={() => openEditScenario(scenario)}
              />
            {/each}
          </div>
        {/if}
      </div>
    </ScrollArea>
  </TabsContent>
</Tabs>

<!-- Character Form Modal -->
{#if showCharForm}
  <VaultCharacterForm
    character={editingCharacter}
    defaultType={defaultCharFormType}
    onClose={() => {
      showCharForm = false;
      editingCharacter = null;
    }}
  />
{/if}

<!-- Lorebook Editor Modal -->
{#if editingLorebook}
  <VaultLorebookEditor
    lorebook={editingLorebook}
    onClose={() => (editingLorebook = null)}
  />
{/if}

<!-- Scenario Editor Modal -->
{#if editingScenario}
  <VaultScenarioEditor
    scenario={editingScenario}
    onClose={() => (editingScenario = null)}
  />
{/if}

<!-- Discovery Modal -->
<DiscoveryModal
  isOpen={showDiscoveryModal}
  mode={discoveryMode}
  onClose={() => (showDiscoveryModal = false)}
/>

<!-- Tag Manager Modal -->
{#if showTagManager}
  <TagManager onClose={() => (showTagManager = false)} />
{/if}
