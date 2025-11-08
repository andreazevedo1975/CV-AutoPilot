import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Lead, CVLayout } from '../types';

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a CV and provides feedback.
 * @param cvContent The content of the CV.
 * @returns A string containing the analysis in Markdown format.
 */
export const analyzeCV = async (cvContent: string): Promise<string> => {
  try {
    const prompt = `
      Analise o seguinte currículo em português e forneça uma análise detalhada dos pontos fortes e fracos.
      Dê sugestões específicas de melhoria em formato de lista (bullet points).
      Formate toda a resposta em Markdown, usando títulos para seções como "Pontos Fortes", "Pontos a Melhorar" e "Sugestões".
      
      Currículo:
      ---
      ${cvContent}
      ---
    `;

    // FIX: Use ai.models.generateContent according to guidelines.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    // FIX: Extract text directly from the response object.
    return response.text;
  } catch (error) {
    console.error("Error analyzing CV:", error);
    throw new Error("Não foi possível analisar o currículo. Verifique sua chave de API e tente novamente.");
  }
};

/**
 * Generates content (optimized CV or cover letter) based on a CV and job description.
 * @param cvContent The user's CV.
 * @param jobDescription The job description.
 * @param type The type of content to generate.
 * @returns The generated text.
 */
export const generateContentForJob = async (
  cvContent: string,
  jobDescription: string,
  type: 'cv' | 'cover-letter'
): Promise<string> => {
  let prompt = '';

  if (type === 'cv') {
    prompt = `
      Otimize o seguinte currículo para a vaga descrita abaixo.
      O currículo otimizado deve destacar as experiências e habilidades mais relevantes para a vaga, reorganizando e reescrevendo seções conforme necessário.
      O objetivo é criar a melhor versão possível do currículo para esta vaga específica.
      Retorne APENAS o texto do currículo otimizado, sem comentários adicionais ou formatação Markdown.

      [Currículo Original]
      ---
      ${cvContent}
      ---

      [Descrição da Vaga]
      ---
      ${jobDescription}
      ---
    `;
  } else { // cover-letter
    prompt = `
      Escreva uma carta de apresentação profissional e concisa com base no currículo e na descrição da vaga abaixo.
      A carta deve ser direcionada à equipe de recrutamento da empresa, destacando como as habilidades e experiências do candidato atendem perfeitamente aos requisitos da vaga.
      O tom deve ser formal, mas entusiástico e confiante.
      Retorne APENAS o texto da carta de apresentação, sem comentários adicionais.

      [Currículo]
      ---
      ${cvContent}
      ---

      [Descrição da Vaga]
      ---
      ${jobDescription}
      ---
    `;
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    throw new Error("Não foi possível gerar o conteúdo. Tente novamente mais tarde.");
  }
};

/**
 * Handles a chat conversation with the AI career advisor.
 * @param messages The history of chat messages.
 * @returns The model's response text and any grounding sources.
 */
export const chat = async (messages: ChatMessage[]): Promise<{ text: string; sources?: { uri: string; title: string }[] }> => {
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const latestMessage = messages[messages.length - 1].text;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{text: latestMessage}] }],
        config: {
            systemInstruction: `
                Você é Sofia Ribeiro, uma orientadora de carreira e especialista em RH. Sua missão é ajudar os usuários a se prepararem para entrevistas de emprego, otimizar seus currículos e fornecer conselhos de carreira.
                Use um tom amigável, profissional e encorajador. Forneça respostas práticas e acionáveis.
                Quando relevante e para informações atuais ou que necessitem de fontes externas, use a busca para fundamentar suas respostas.
            `,
            tools: [{ googleSearch: {} }],
        },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
        ?.filter(chunk => chunk.web)
        .map(chunk => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        })) || [];
        
    return { text: response.text, sources: sources.length > 0 ? sources : undefined };
  } catch (error) {
    console.error("Error in chat:", error);
    throw new Error("Erro na comunicação com o assistente. Tente novamente.");
  }
};

/**
 * Finds job leads based on user criteria.
 * @param jobTitle The desired job title.
 * @param location The desired location.
 * @param jobType The type of job (remote, hybrid, etc.).
 * @param searchSource Where to search (companies, social media).
 * @param skills Relevant skills for the job.
 * @returns A promise that resolves to an array of Lead objects.
 */
export const findLeads = async (
    jobTitle: string,
    location: string,
    jobType: string,
    searchSource: string,
    skills: string
): Promise<Lead[]> => {
    const prompt = `
        Encontre leads de prospecção ativa para um candidato ao cargo de "${jobTitle}" com as seguintes habilidades: "${skills}".
        A busca deve focar em ${searchSource === 'empresas' ? 'sites de carreira de empresas e contatos de RH' : 'posts em redes sociais e hashtags relevantes'}.
        Se uma localização for fornecida ("${location}"), priorize-a. Para o tipo de vaga "${jobType}", encontre contatos relevantes.
        O contato (contactInfo) deve ser um e-mail de RH, uma página de 'Trabalhe Conosco', ou um link para um post de vaga em uma rede social.
        Em 'notes', adicione um breve resumo (1-2 frases) sobre por que o lead é relevante, mencionando a fonte se possível.
        Retorne uma lista de no máximo 10 leads.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            companyName: {
                                type: Type.STRING,
                                description: 'O nome da empresa ou do post na rede social.',
                            },
                            contactInfo: {
                                type: Type.STRING,
                                description: 'E-mail, URL da página de carreiras, ou link do post.',
                            },
                            notes: {
                                type: Type.STRING,
                                description: 'Breve resumo da relevância do lead.',
                            },
                        },
                        required: ["companyName", "contactInfo", "notes"]
                    },
                },
            },
        });
        
        let jsonStr = response.text.trim();
        const leads: Lead[] = JSON.parse(jsonStr);
        return leads;
    } catch (error) {
        console.error("Error finding leads:", error);
        throw new Error("Não foi possível encontrar leads. A busca pode ter sido muito específica ou ocorreu um erro. Tente novamente com termos diferentes.");
    }
};

/**
 * Generates CV layout suggestions.
 * @returns A promise that resolves to an array of CVLayout objects.
 */
export const generateCVLayoutSuggestions = async (): Promise<Omit<CVLayout, 'id'>[]> => {
    const prompt = `
        Gere 5 sugestões distintas de layouts de currículo em português (por exemplo: moderno, cronológico, criativo, funcional, acadêmico).
        Para cada sugestão, forneça:
        - "name": O nome do layout (ex: "Executivo Moderno").
        - "description": Uma breve descrição do layout e para quem ele é ideal.
        - "keyFeatures": Uma lista (array de strings) com 3 a 4 pontos-chave do layout.
        - "previewContent": Um exemplo de estrutura textual simples, como um esqueleto, para ilustrar a organização das seções.

        Formate a saída como um array JSON válido.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                            previewContent: { type: Type.STRING },
                        },
                        required: ["name", "description", "keyFeatures", "previewContent"]
                    },
                },
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating CV layouts:", error);
        throw new Error("Não foi possível gerar sugestões de layout. Tente novamente.");
    }
};

/**
 * Applies a selected layout to a given CV content.
 * @param cvContent The original CV content.
 * @param layout The layout to apply.
 * @returns A promise that resolves to the restructured CV content as a string.
 */
export const applyCVLayout = async (cvContent: string, layout: CVLayout): Promise<string> => {
    const prompt = `
        Reestruture o seguinte currículo para seguir as diretrizes do layout "${layout.name}".
        O layout é descrito como: "${layout.description}".
        Características principais a serem consideradas: ${layout.keyFeatures.join(', ')}.
        O resultado deve ser APENAS o texto do currículo reformatado.
        IMPORTANTE: Envolva CADA título de seção com ##. Por exemplo: ## Experiência Profissional ## ou ## Formação Acadêmica ##. Não use formatação Markdown.

        [Currículo Original]
        ---
        ${cvContent}
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error applying CV layout:", error);
        throw new Error("Não foi possível aplicar o layout ao currículo. Tente novamente.");
    }
};