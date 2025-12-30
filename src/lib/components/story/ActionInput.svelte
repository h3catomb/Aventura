<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { story } from '$lib/stores/story.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { aiService } from '$lib/services/ai';
  import { Send, Wand2, MessageSquare, Brain, Sparkles } from 'lucide-svelte';

  let inputValue = $state('');
  let actionType = $state<'do' | 'say' | 'think' | 'story'>('do');

  const actionPrefixes = {
    do: 'You ',
    say: 'You say "',
    think: 'You think to yourself, "',
    story: '',
  };

  const actionSuffixes = {
    do: '',
    say: '"',
    think: '"',
    story: '',
  };

  async function handleSubmit() {
    if (!inputValue.trim() || ui.isGenerating) return;

    const content = actionPrefixes[actionType] + inputValue.trim() + actionSuffixes[actionType];

    // Add user action to story
    await story.addEntry('user_action', content);

    // Clear input
    inputValue = '';

    // Generate AI response with streaming
    if (settings.hasApiKey) {
      ui.setGenerating(true);
      ui.startStreaming();

      try {
        // Build world state for AI context
        const worldState = {
          characters: story.characters,
          locations: story.locations,
          items: story.items,
          storyBeats: story.storyBeats,
          currentLocation: story.currentLocation,
        };

        let fullResponse = '';

        // Use streaming response
        for await (const chunk of aiService.streamResponse(story.entries, worldState, story.currentStory)) {
          if (chunk.content) {
            fullResponse += chunk.content;
            ui.appendStreamContent(chunk.content);
          }

          if (chunk.done) {
            break;
          }
        }

        // Save the complete response as a story entry
        if (fullResponse.trim()) {
          await story.addEntry('narration', fullResponse);
        }
      } catch (error) {
        console.error('Generation failed:', error);
        await story.addEntry('system', 'Failed to generate response. Please check your API settings.');
      } finally {
        ui.endStreaming();
        ui.setGenerating(false);
      }
    } else {
      await story.addEntry('system', 'Please configure your OpenRouter API key in settings to enable AI generation.');
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="space-y-3">
  <!-- Action type buttons -->
  <div class="flex gap-2">
    <button
      class="btn flex items-center gap-1.5 text-sm"
      class:btn-primary={actionType === 'do'}
      class:btn-secondary={actionType !== 'do'}
      onclick={() => actionType = 'do'}
    >
      <Wand2 class="h-4 w-4" />
      Do
    </button>
    <button
      class="btn flex items-center gap-1.5 text-sm"
      class:btn-primary={actionType === 'say'}
      class:btn-secondary={actionType !== 'say'}
      onclick={() => actionType = 'say'}
    >
      <MessageSquare class="h-4 w-4" />
      Say
    </button>
    <button
      class="btn flex items-center gap-1.5 text-sm"
      class:btn-primary={actionType === 'think'}
      class:btn-secondary={actionType !== 'think'}
      onclick={() => actionType = 'think'}
    >
      <Brain class="h-4 w-4" />
      Think
    </button>
    <button
      class="btn flex items-center gap-1.5 text-sm"
      class:btn-primary={actionType === 'story'}
      class:btn-secondary={actionType !== 'story'}
      onclick={() => actionType = 'story'}
    >
      <Sparkles class="h-4 w-4" />
      Story
    </button>
  </div>

  <!-- Input area -->
  <div class="flex gap-2">
    <div class="relative flex-1">
      <textarea
        bind:value={inputValue}
        onkeydown={handleKeydown}
        placeholder={actionType === 'story' ? 'Describe what happens...' : 'What do you do?'}
        class="input min-h-[60px] resize-none pr-12"
        rows="2"
        disabled={ui.isGenerating}
      ></textarea>
    </div>
    <button
      onclick={handleSubmit}
      disabled={!inputValue.trim() || ui.isGenerating}
      class="btn btn-primary self-end px-4 py-3"
    >
      <Send class="h-5 w-5" />
    </button>
  </div>
</div>
