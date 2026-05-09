import OpenAI from "openai";

export class OpenAIProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY || "";

    this.client = new OpenAI({
      apiKey: key
    });
  }

  private normalizeText(value: any): string {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (typeof item === "object" && item?.text) {
            return item.text;
          }

          return JSON.stringify(item);
        })
        .join("\n");
    }

    if (typeof value === "object" && value?.text) {
      return value.text;
    }

    return String(value || "");
  }

  async generateText(params: {
    model: "gpt-4o-mini" | "gpt-4.1-mini";
    systemInstruction: string;
    history: any[];
    userInput: string;
    imageParts?: any[];
  }): Promise<string> {
    const {
      model,
      systemInstruction,
      history,
      userInput,
      imageParts = []
    } = params;

    const input: any[] = [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: this.normalizeText(systemInstruction)
          }
        ]
      },

      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: [
          {
            type: "input_text",
            text: this.normalizeText(m.content)
          }
        ]
      })),

      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: this.normalizeText(userInput)
          },

          ...imageParts
            .map((p) => p?.inlineData)
            .filter(Boolean)
            .map((img: any) => ({
              type: "input_image",
              image_url: `data:${img.mimeType};base64,${img.data}`
            }))
        ]
      }
    ];

    const response = await this.client.responses.create({
      model,
      input
    });

    return response.output_text || "";
  }

  async generateRouterDecision(prompt: string): Promise<string> {
    const response = await this.client.responses.create({
      model: "gpt-4o-mini",

      input: [
        {
          role: "user",

          content: [
            {
              type: "input_text",
              text: this.normalizeText(prompt)
            }
          ]
        }
      ]
    });

    return response.output_text || "";
  }
}