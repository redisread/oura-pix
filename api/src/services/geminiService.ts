import type { GenerationResult, GenerationSettings } from "@oura-pix/database";

interface GeminiEnv {
  GEMINI_API_KEY?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_MODEL?: string;
}

interface ImageInput {
  url: string;
  mimeType: string;
}

interface GenerateCopyInput {
  env: GeminiEnv;
  productImage?: ImageInput | null;
  referenceImages?: ImageInput[];
  prompt?: string | null;
  settings: GenerationSettings;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function imageToPart(image: ImageInput): Promise<GeminiPart | null> {
  try {
    const response = await fetch(image.url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return {
      inlineData: {
        mimeType: image.mimeType,
        data: arrayBufferToBase64(buffer),
      },
    };
  } catch {
    return null;
  }
}

function buildPrompt(input: GenerateCopyInput): string {
  const settings = input.settings;
  const count = Math.min(Math.max(settings.count ?? 3, 1), 10);
  const language = settings.language || "en";
  const platform = settings.targetPlatform || "generic";
  const style = settings.style || "professional";

  return [
    "You are an expert cross-border e-commerce product detail page copywriter.",
    `Create ${count} product detail page asset variants for ${platform}.`,
    `Write in language code: ${language}.`,
    `Visual/copy style: ${style}.`,
    input.prompt ? `User instruction: ${input.prompt}` : "",
    "Return only valid JSON. No markdown, no code fence.",
    "JSON shape:",
    "[{\"id\":\"variant-1\",\"title\":\"...\",\"description\":\"...\",\"tags\":[\"...\"],\"confidenceScore\":0.9,\"metadata\":{\"angle\":\"...\",\"platform\":\"...\"}}]",
  ].filter(Boolean).join("\n");
}

function extractText(response: GeminiResponse): string {
  return response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim() ?? "";
}

function parseResults(text: string): GenerationResult[] {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response was not a JSON array");
  }
  return parsed.map((item, index) => {
    const value = item as Partial<GenerationResult>;
    return {
      id: value.id || `variant-${index + 1}`,
      title: value.title || `Variant ${index + 1}`,
      description: value.description || "",
      tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
      confidenceScore: typeof value.confidenceScore === "number" ? value.confidenceScore : undefined,
      metadata: typeof value.metadata === "object" && value.metadata !== null ? value.metadata : undefined,
    };
  });
}

export async function generateProductCopy(input: GenerateCopyInput): Promise<GenerationResult[]> {
  if (!input.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const parts: GeminiPart[] = [{ text: buildPrompt(input) }];
  const imageParts = await Promise.all([
    input.productImage ? imageToPart(input.productImage) : Promise.resolve(null),
    ...(input.referenceImages ?? []).map(imageToPart),
  ]);
  parts.push(...imageParts.filter((part): part is GeminiPart => part !== null));

  const baseUrl = input.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const model = input.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": input.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response.status}${message ? ` ${message}` : ""}`);
  }

  const data = await response.json() as GeminiResponse;
  const text = extractText(data);
  if (!text) throw new Error("Gemini returned an empty response");
  return parseResults(text);
}
