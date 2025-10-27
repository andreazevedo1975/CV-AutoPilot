// FIX: Implement the Gemini service functions to interact with the Google Generative AI API for various AI-powered features.
import { GoogleGenAI, Content } from "@google/genai";
import { ChatMessage } from "../types";

// FIX: Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function optimizeCV(cv: string, jobDescription: string): Promise<string> {
    const prompt = `Com base na descrição da vaga a seguir, otimize o currículo fornecido. Retorne apenas o conteúdo do currículo otimizado, sem nenhum comentário extra antes ou depois.
    
    Descrição da Vaga:
    ---
    ${jobDescription}
    ---
    
    Currículo:
    ---
    ${cv}
    ---
    `;

    try {
        // FIX: Use ai.models.generateContent for generating text.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // FIX: Extract text from response using the .text property.
        return response.text;
    } catch (error) {
        console.error("Erro ao otimizar o currículo:", error);
        throw new Error("Falha ao otimizar o currículo.");
    }
}

export async function generateCoverLetter(cv: string, jobDescription: string): Promise<string> {
    const prompt = `Com base no currículo e na descrição da vaga fornecidos, escreva uma carta de apresentação convincente e profissional.
    
    Descrição da Vaga:
    ---
    ${jobDescription}
    ---
    
    Currículo:
    ---
    ${cv}
    ---
    `;
    try {
        // FIX: Use ai.models.generateContent for generating text.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // FIX: Extract text from response using the .text property.
        return response.text;
    } catch (error) {
        console.error("Erro ao gerar a carta de apresentação:", error);
        throw new Error("Falha ao gerar a carta de apresentação.");
    }
}

export async function chat(history: ChatMessage[]): Promise<{ text: string, sources: { uri: string; title: string }[] }> {
    // FIX: Map chat history to the format expected by the Gemini API.
    const contents: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
    
    try {
        // FIX: Use a more advanced model for chat and enable Google Search grounding.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                systemInstruction: "Você é um especialista sênior de Recursos Humanos. Seu objetivo é fornecer orientação profissional a candidatos a emprego. Ofereça conselhos concretos sobre como se portar em uma entrevista, as melhores formas de responder a perguntas em formulários, e como abordar testes profissionais. Seu tom deve ser encorajador, profissional e perspicaz.",
                tools: [{ googleSearch: {} }],
            }
        });
        
        // FIX: Extract text from response using the .text property.
        const text = response.text;
        // FIX: Extract grounding metadata for search results.
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
            .map(chunk => ({
                uri: chunk.web.uri!,
                title: chunk.web.title!,
            }));

        return { text, sources };

    } catch (error) {
        console.error("Erro no chat:", error);
        throw new Error("Falha ao obter a resposta do chat.");
    }
}