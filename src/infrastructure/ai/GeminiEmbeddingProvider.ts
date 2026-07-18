import type { EmbeddingProvider } from "./AIProvider";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private apiKey: string,
    private model: string = process.env.GEMINI_EMBEDDING_MODEL ??
      "gemini-embedding-001",
  ) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch(
      `${GEMINI_URL}/${this.model}:embedContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          // 768 dims: ~0.26% quality loss vs default 3072, quarter the storage/compute.
          // gemini-embedding-001 does NOT auto-normalize truncated output — normalize before storing.
          output_dimensionality: 768,
        }),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Gemini embedding request failed: ${res.status} ${await res.text()}`,
      );
    }

    const data = await res.json();
    const values: number[] = data.embedding.values;
    return normalize(values);
  }

  // Free tier is request-per-day limited (1,500/day), not batch-endpoint limited,
  // so batching here just loops — one request per text. Keep chunk counts in mind.
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}
