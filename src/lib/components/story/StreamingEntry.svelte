<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { BookOpen } from 'lucide-svelte';

  // Reactive binding to streaming content
  let content = $derived(ui.streamingContent);
</script>

<div class="rounded-lg border-l-4 border-l-accent-500 bg-accent-500/5 p-4 animate-fade-in">
  <div class="flex items-start gap-3">
    <div class="mt-0.5 rounded-full bg-surface-700 p-1.5">
      <BookOpen class="h-4 w-4 text-accent-400 animate-pulse" />
    </div>
    <div class="flex-1">
      <div class="story-text whitespace-pre-wrap">
        {content}<span class="inline-block w-2 h-4 ml-0.5 bg-accent-400 animate-blink"></span>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .animate-blink {
    animation: blink 1s infinite;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
</style>
