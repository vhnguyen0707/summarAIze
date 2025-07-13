import {OpenAI} from "openai";

export function getPrompt(title: string) {
    return `Please summarize this YouTube video titled ${title}'s transcript into 6 bullet points. ` +
        "Each should correspond to a distinct portion of the video and highlight the main topic. " +
        "Irrelevant parts like sponsorship can be ignored. Transcript:"
}

// https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1
export async function getMistralSummary(title: string, transcript: string): Promise<string | null> {
    const client = new OpenAI({
        baseURL: "https://router.huggingface.co/together/v1",
        apiKey: process.env.HF_TOKEN,
        dangerouslyAllowBrowser: true,
    })

    const chatCompletion = await client.chat.completions.create({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
            { role: "user", content: `${getPrompt(title)}\n\n${transcript}` }
        ],
    });

    return chatCompletion.choices[0].message.content;
}