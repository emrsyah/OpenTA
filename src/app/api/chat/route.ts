
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const {
        model,
        messages,
        webSearch,
    }: {
        messages: UIMessage[];
        model: string;
        webSearch?: boolean;
    } = await req.json();

    // Simple model selection logic
    // If webSearch is requested, ideally we'd switch to a search-capable model like Perplexity
    // Since we only have openai installed, we'll just use the requested model (e.g. gpt-4o)
    // or fallback to 'gpt-4o'.
    const selectedModel = openai(model || 'gpt-4o');

    const result = streamText({
        model: selectedModel,
        messages: await convertToModelMessages(messages),
    });

    return result.toTextStreamResponse();
}
