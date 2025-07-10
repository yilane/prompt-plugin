export default defineContentScript({
  matches: [
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://chat.deepseek.com/*',
    'https://www.doubao.com/*',
  ],
  main() {
    console.log('AI-Prompts content script loaded. Ready to assist.');

    /**
     * Finds the target text area on the page and attaches an input listener.
     * This function is designed to work with SPAs where the element might not be
     * available on initial load.
     * @returns {boolean} - True if the listener was attached, false otherwise.
     */
    function findAndAttachListener(): boolean {
      // A more robust selector to target various AI chat platforms' main input.
      const targetSelector =
        'textarea[id*="prompt"], textarea[placeholder*="Message"], textarea[placeholder*="Send a message"]';
      const textarea = document.querySelector<HTMLTextAreaElement>(targetSelector);

      if (textarea && !textarea.dataset.promptListenerAttached) {
        console.log('Input area found, attaching listener:', textarea);
        textarea.dataset.promptListenerAttached = 'true'; // Mark as attached to prevent duplicates
        textarea.addEventListener('input', handleInput);
        return true;
      }

      return false;
    }

    /**
     * Handles the input event on the textarea.
     * Checks for the '@@' trigger.
     * @param {Event} event - The input event.
     */
    function handleInput(event: Event): void {
      const target = event.target as HTMLTextAreaElement;
      if (target.value.includes('@@')) {
        console.log('Trigger "@@" detected! Value:', target.value);
        // Future implementation:
        // 1. Show a prompt selection UI near the textarea.
        // 2. Filter prompts based on text after '@@'.
        // 3. On selection, replace '@@...' with the prompt content.
      }
    }

    // Start polling to find the textarea.
    // Using a MutationObserver is more efficient, but setInterval is simpler for this first step.
    const intervalId = setInterval(() => {
      if (findAndAttachListener()) {
        // Once found, we can stop polling.
        // However, for SPAs, the element might be removed and re-added.
        // A more robust solution with MutationObserver will be needed later.
        console.log('Listener attached. Polling will stop for now.');
        clearInterval(intervalId);
      }
    }, 1000); // Poll every second.
  },
}); 