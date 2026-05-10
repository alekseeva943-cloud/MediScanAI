// src/providers/openaiProvider.ts

import OpenAI from "openai";

export class OpenAIProvider {

  private client: OpenAI;

  constructor(apiKey?: string) {

    const key =
      apiKey ||
      process.env.OPENAI_API_KEY ||
      "";

    this.client =
      new OpenAI({
        apiKey: key
      });
  }

  // -----------------------------------
  // NORMALIZE TEXT
  // -----------------------------------

  private normalizeText(
    value: any
  ): string {

    if (
      typeof value === "string"
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {

      return value

        .map((item) => {

          if (
            typeof item === "string"
          ) {
            return item;
          }

          if (
            typeof item === "object"
            &&
            item?.text
          ) {
            return item.text;
          }

          return JSON.stringify(item);
        })

        .join("\n");
    }

    if (
      typeof value === "object"
      &&
      value?.text
    ) {

      return value.text;
    }

    return String(value || "");
  }

  // -----------------------------------
  // GENERATE TEXT
  // -----------------------------------

  async generateText(params: {

    model:
    | "gpt-4o-mini"
    | "gpt-4.1-mini";

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

        content:
          this.normalizeText(
            systemInstruction
          )
      },

      ...history.map((m) => ({

        role:

          m.role === "user"
            ? "user"
            : "assistant",

        content:
          this.normalizeText(
            m.content
          )
      })),

      {
        role: "user",

        content: [

          {
            type: "input_text",

            text:
              this.normalizeText(
                userInput
              )
          },

          ...imageParts

            .map((p) => p?.inlineData)

            .filter(Boolean)

            .map((img: any) => ({

              type: "input_image",

              image_url:
                `data:${img.mimeType};base64,${img.data}`
            }))
        ]
      }
    ];

    const response =
      await this.client.responses.create({

        model,

        input,

        temperature: 0.4
      });

    return (
      response.output_text || ""
    );
  }

  // -----------------------------------
  // ROUTER / EXTRACTION
  // -----------------------------------

  async generateRouterDecision(
    prompt: string
  ): Promise<string> {

    const response =
      await this.client.responses.create({

        model: "gpt-4.1-mini",

        temperature: 0.1,

        input: [

          {
            role: "system",

            content: [

              {
                type: "input_text",

                text:
                  "Return ONLY valid JSON."
              }
            ]
          },

          {
            role: "user",

            content: [

              {
                type: "input_text",

                text: prompt
              }
            ]
          }
        ]
      });

    return (
      response.output_text || ""
    );
  }}