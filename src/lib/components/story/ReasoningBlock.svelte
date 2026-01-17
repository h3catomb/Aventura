<script lang="ts">
  import { slide } from 'svelte/transition';
  import { parseMarkdown } from '$lib/utils/markdown';

  let { 
    content, 
    isStreaming = false,
    isVisualProse = false
  }: { 
    content: string; 
    isStreaming?: boolean;
    isVisualProse?: boolean;
  } = $props();

  // Auto-open while streaming, closed by default for completed entries
  let isOpen = $state(isStreaming);

  // Update isOpen when isStreaming changes to true (new generation started)
  $effect(() => {
    if (isStreaming) {
      isOpen = true;
    }
  });

  let renderedContent = $derived(
    isVisualProse ? content : parseMarkdown(content)
  );
</script>

<div class="reasoning-block mb-4">
  <button 
    class="flex items-center gap-2 text-left w-full bg-transparent border-none p-0 cursor-pointer group h-7"
    onclick={() => isOpen = !isOpen}
    title={isOpen ? "Collapse thought process" : "Expand thought process"}
  >
    <div class="flex items-center gap-2 text-surface-400">
      {#if isStreaming}
        <span class="text-sm italic">Thinking</span>
        <span class="thinking-dots">
          <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </span>
      {:else}
        <span class="text-xs font-medium">Thought Process</span>
      {/if}
      
      <span class="text-xs opacity-50">{isOpen ? '▼' : '▶'}</span>
    </div>
  </button>
  
  {#if isOpen}
    <div class="reasoning-content mt-2 text-sm text-surface-400 italic" transition:slide={{ duration: 200 }}>
      {@html renderedContent}
    </div>
  {/if}
</div>

<style>
  /* Thinking dots animation */
  @keyframes dot-pulse {
    0%, 20% { opacity: 0.2; }
    40% { opacity: 1; }
    60%, 100% { opacity: 0.2; }
  }

  .thinking-dots .dot {
    animation: dot-pulse 1.4s infinite;
    font-weight: bold;
    color: var(--color-accent-400, #60a5fa);
  }

  .thinking-dots .dot:nth-child(1) { animation-delay: 0s; }
  .thinking-dots .dot:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dots .dot:nth-child(3) { animation-delay: 0.4s; }
</style>
