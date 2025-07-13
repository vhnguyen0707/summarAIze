import {getPrompt} from "./huggingface";

export async function getOpenAIMSummary(title: string, transcript: string) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an assistant that summarizes YouTube transcripts." },
                { role: "user", content: `${getPrompt(title)}\n\n${transcript}` }
            ],
            temperature: 0.7,
        }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
}