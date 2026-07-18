export interface CompletionProvider {
  /**
   * @param systemPrompt   role/behavior instructions (e.g. "explain like I'm new here")
   * @param userPrompt     the user's actual question
   * @param context        retrieved chunks to ground the answer in
   */
  complete(
    systemPrompt: string,
    userPrompt: string,
    context: string[],
  ): Promise<string>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
