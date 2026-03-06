/**
 * Voyage AI client for generating embeddings
 * Uses voyage-4-lite model for semantic search
 * Implements native fetch to avoid SDK bundling issues with Turbopack
 */

// Model configuration
export const VOYAGE_MODEL = "voyage-4-lite";
export const VOYAGE_DIMENSIONS = 1024;
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

interface VoyageError {
  message: string;
  type: string;
  code?: string;
}

/**
 * Get the Voyage API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Make a request to the Voyage AI embeddings API
 */
async function voyageEmbedRequest(
  input: string | string[],
  inputType: "query" | "document",
): Promise<VoyageEmbeddingResponse> {
  const apiKey = getApiKey();

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      model: VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: VOYAGE_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as VoyageError;
    throw new Error(
      `Voyage API error: ${error.message || response.statusText}`,
    );
  }

  return response.json() as Promise<VoyageEmbeddingResponse>;
}

/**
 * Embed a single query for semantic search
 * Uses input_type="query" for optimal retrieval performance
 *
 * @param query - The search query text
 * @returns Array of embedding values (1024 dimensions)
 */
export async function embedQuery(query: string): Promise<number[]> {
  const response = await voyageEmbedRequest(query, "query");

  if (
    !response.data ||
    response.data.length === 0 ||
    !response.data[0].embedding
  ) {
    throw new Error("No embedding returned from Voyage API");
  }

  return response.data[0].embedding;
}

/**
 * Embed multiple texts (for batch indexing documents)
 * Uses input_type="document" for optimal retrieval performance
 *
 * @param texts - Array of text strings to embed
 * @returns Array of embeddings
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const response = await voyageEmbedRequest(texts, "document");

  if (!response.data || response.data.length === 0) {
    throw new Error("No embeddings returned from Voyage API");
  }

  // Sort by index to maintain order and extract embeddings
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

/**
 * Check if Voyage API is configured
 */
export function isVoyageConfigured(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}
