import { GoogleGenAI, Chat, Type, GenerateContentResponse, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import type { GameResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: "The next segment of the narrative in 1-2 paragraphs. It should be descriptive, mysterious, and written in the second person.",
        },
        choices: {
            type: Type.ARRAY,
            description: "An array of 2 to 4 choices for the player.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: {
                        type: Type.STRING,
                        description: "The text for the choice button, e.g., 'Examine the glyphs.'"
                    },
                    action: {
                        type: Type.STRING,
                        description: "A short phrase describing the action for the AI to process, e.g., 'Player examines the glyphs.'"
                    }
                },
                required: ['text', 'action'],
            },
        },
        imagePrompt: {
            type: Type.STRING,
            description: "An optional, concise, and descriptive prompt for an image generation model, used only for key visual moments. Style: photorealistic, ancient, mysterious, cinematic lighting."
        }
    },
    required: ['story', 'choices'],
};

let chat: Chat | null = null;

export const startChat = (): void => {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.8,
            topP: 0.9,
        },
    });
};

export const getNextStep = async (playerInput: string): Promise<GameResponse> => {
    if (!chat) {
        throw new Error("Chat not initialized. Call startChat first.");
    }

    try {
        const result: GenerateContentResponse = await chat.sendMessage({ message: playerInput });
        const text = result.text.trim();

        try {
            const parsedResponse: GameResponse = JSON.parse(text);
            return parsedResponse;
        } catch (e) {
            console.error("Failed to parse JSON response from Gemini:", text);
            // This is a fallback in case the API returns non-JSON or malformed JSON
            return {
                story: "A strange cosmic interference disrupts your connection to the narrative. The path forward is unclear, as if powerful forces are trying to hide the truth. You must try to push through the static.",
                choices: [{ text: "Try to re-establish the connection", action: "Recap the situation and try to continue the investigation." }],
            };
        }
    } catch (error) {
        console.error("Error fetching next step from Gemini:", error);
         return {
            story: "A critical connection has been lost. The echoes of the past fall silent. Check your credentials and try to reconnect with the source.",
            choices: [],
        };
    }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};