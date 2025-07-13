import {getPrompt} from "./huggingface";
import {OpenAI} from "openai";

const openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    dangerouslyAllowBrowser: true,
});

// https://openrouter.ai/mistralai/mistral-7b-instruct-v0.1/api
export async function getOpenRouterSummary(title: string, transcript: string, language: string = "English") {
    try {
        const chatCompletions = await openRouterClient.chat.completions.create({
            model: "mistralai/mistral-7b-instruct-v0.1",
            messages: [
                { role: "user", content: `${getPrompt(title, language)}\n\n${transcript}` }
            ],
        });

        return chatCompletions.choices?.[0]?.message?.content ?? "No summary available.";
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        return null;
    }
}