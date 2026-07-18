/**
 * Every LLM/embedding call anywhere in modules/ must go through these two
 * interfaces. Never call OpenRouter or Hugging Face directly from a service —
 * that's what makes provider-switching (a PRD requirement) actually possible,
 * and what keeps modules/ unit-testable without hitting a real API.
 */

export interface CompletionProvider {
  /**
   * @param systemPrompt   role/behavior instructions (e.g. "explain like I'm new here")
   * @param userPrompt     the user's actual question
   * @param context        retrieved chunks to ground the answer in
   */
  complete(systemPrompt: string, userPrompt: string, context: string[]): Promise<string>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
