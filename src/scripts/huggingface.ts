import { OpenAI } from "openai";

// Create client once, outside of functions
const huggingfaceClient = new OpenAI({
    baseURL: "https://router.huggingface.co/together/v1",
    apiKey: process.env.HF_TOKEN,
    dangerouslyAllowBrowser: true,
});

export function getPrompt(title: string, language: string = "English"): string {
    return `Please summarize this YouTube video titled ${title}'s transcript into 6 bullet points. ` +
        `The transcript is in ${language}. Please provide the summary in the same language (${language}). ` +
        "Each bullet point should correspond to a distinct portion of the video and highlight the main topic. " +
        "Irrelevant parts like sponsorship can be ignored. Transcript:"
}

// https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1
export async function getMistralSummary(title: string, transcript: string, language: string = "English"): Promise<string | null> {
    try {
        const chatCompletion = await huggingfaceClient.chat.completions.create({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "user", content: `${getPrompt(title, language)}\n\n${transcript}` }
            ],
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Hugging Face API:", error);
        return null;
    }
}