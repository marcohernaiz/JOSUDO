/**
 * Shared utility for enhancing messages based on thinking mode and web search
 */

export interface MessageEnhancementOptions {
  thinkingMode?: 'fast' | 'deep' | 'research';
  webSearch?: boolean;
}

/**
 * Enhances a message based on thinking mode and web search preferences
 * @param message - The original user message
 * @param options - Enhancement options
 * @returns Enhanced message with appropriate prompts
 */
export function enhanceMessageForThinking(
  message: string, 
  options: MessageEnhancementOptions = {}
): string {
  let enhancedMessage = message;
  
  // Apply thinking mode enhancements
  if (options.thinkingMode === 'deep') {
    enhancedMessage = `Please think deeply and thoroughly about this question. Take your time to analyze all aspects, consider multiple perspectives, and provide a comprehensive response. Here's the question: ${message}`;
  } else if (options.thinkingMode === 'research') {
    enhancedMessage = `Please conduct thorough research and provide a detailed, well-researched response. Consider multiple sources, analyze different viewpoints, and provide evidence-based insights. Here's the research topic: ${message}`;
  }
  
  // Apply web search enhancement (can be combined with thinking modes)
  if (options.webSearch) {
    enhancedMessage += `\n\nPlease search for the most current information available and provide up-to-date insights.`;
  }
  
  return enhancedMessage;
}

/**
 * Gets appropriate model parameters based on thinking mode
 * @param options - Enhancement options
 * @returns Object with maxTokens and temperature
 */
export function getModelParameters(options: MessageEnhancementOptions = {}): {
  maxTokens: number;
  temperature: number;
} {
  return {
    maxTokens: options.thinkingMode === 'research' ? 8192 : 4096,
    temperature: options.thinkingMode === 'deep' ? 0.3 : 0.7
  };
}
