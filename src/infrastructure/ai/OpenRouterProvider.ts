import type { CompletionProvider } from "./AIProvider";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements CompletionProvider {
  constructor(
    private apiKey: string,
    private model: string = process.env.OPENROUTER_MODEL ??
      "openai/gpt-oss-20b:free",
    private fallbackModel: string = "openrouter/free",
  ) {}

  async complete(
    systemPrompt: string,
    userPrompt: string,
    context: string[],
  ): Promise<string> {
    const contextBlock = context.length
      ? `Relevant code context:\n\n${context.join("\n---\n")}`
      : "";

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        models: [this.model, this.fallbackModel],
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${contextBlock}\n\nQuestion: ${userPrompt}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(
        `OpenRouter request failed: ${res.status} ${await res.text()}`,
      );
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}
