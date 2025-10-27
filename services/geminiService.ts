// FIX: Implement the Gemini service functions to interact with the Google Generative AI API for various AI-powered features.
import { GoogleGenAI, Content, Type } from "@google/genai";
import { ChatMessage, Lead } from "../types";

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

export async function analyzeCV(cvContent: string): Promise<string> {
    const prompt = `Como um especialista sênior de Recursos Humanos, analise o seguinte currículo. Forneça uma análise detalhada e construtiva em formato Markdown. A sua análise deve incluir os seguintes pontos:

1.  **Pontos Fortes:** Identifique as seções e informações que estão bem apresentadas e são impactantes.
2.  **Pontos de Melhoria:** Aponte áreas que precisam de correção ou podem ser melhoradas. Seja específico sobre o que mudar (ex: "Reformule a descrição da experiência X para focar em resultados quantificáveis").
3.  **Formato e Estrutura:** Comente sobre a clareza, organização e legibilidade geral do currículo.
4.  **Sugestões de Vagas:** Com base no perfil, habilidades e experiências listadas, sugira 3 a 5 tipos de cargos ou áreas de atuação para os quais este candidato seria um bom concorrente.

---
**Currículo para Análise:**
---
${cvContent}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for detailed analysis
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Erro ao analisar o currículo:", error);
        throw new Error("Falha ao analisar o currículo.");
    }
}


export async function findLeads(jobTitle: string, location: string, jobType: string, searchSource: string): Promise<Lead[]> {
    let prompt = '';
    const locationText = location || 'Brasil (geral)';

    if (searchSource === 'empresas') {
        prompt = `Você é um assistente de pesquisa especializado em recrutamento. Sua tarefa é encontrar contatos públicos de empresas para um candidato a emprego.

**Restrições Críticas de Privacidade (LGPD):**
- **NÃO** forneça e-mails pessoais de funcionários (ex: nome.sobrenome@empresa.com).
- **FORNEÇA APENAS** informações de contato públicas destinadas a receber currículos, como e-mails genéricos de RH (ex: carreiras@empresa.com) ou links para a página "Trabalhe Conosco".
- Se um e-mail direto não estiver publicamente disponível, forneça a URL da página de carreiras da empresa.

**Tarefa:**
Com base nos critérios abaixo, gere uma lista de até 15 empresas que possam ter vagas para este perfil.

**Cargo Desejado:** ${jobTitle}
**Localização:** ${locationText}
**Tipo de Vaga:** ${jobType}

**Formato de Saída:**
Responda estritamente com um objeto JSON que corresponda ao schema fornecido. Não inclua texto fora do JSON.`;
    } else { // searchSource === 'sociais'
        prompt = `Você é um assistente de pesquisa especializado em encontrar oportunidades de emprego em redes sociais.

**Tarefa:**
Encontre até 15 posts públicos, perfis de recrutadores ou hashtags relevantes em redes sociais (como LinkedIn). O usuário forneceu um termo de busca que pode ser um cargo ou uma hashtag.

- **Para posts:** O nome da empresa deve ser o nome do autor ou da empresa que postou. A informação de contato deve ser a URL direta para o post. A nota deve ser um trecho do post.
- **Para hashtags:** Se o termo de busca for uma hashtag, encontre posts que a utilizam. Se for um cargo, sugira hashtags relevantes. O nome da empresa pode ser "Busca por Hashtag". A informação de contato deve ser uma URL de busca para a hashtag na rede social (ex: https://www.linkedin.com/feed/hashtag/?keywords=vagasti). A nota deve indicar qual hashtag foi sugerida ou encontrada.
- Priorize resultados recentes e relevantes.

**Critérios de Busca:**
**Termo de Busca:** ${jobTitle}
**Tipo de Vaga:** ${jobType}
**Localização Sugerida:** ${locationText}

**Formato de Saída:**
Responda estritamente com um objeto JSON que corresponda ao schema fornecido. Não inclua texto fora do JSON.`;
    }
    
    const leadSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            companyName: {
              type: Type.STRING,
              description: 'O nome da empresa, do recrutador, ou uma descrição da fonte (ex: "Post no LinkedIn").',
            },
            contactInfo: {
              type: Type.STRING,
              description: 'A URL do post/perfil, o e-mail público de RH, ou a URL da página "Trabalhe Conosco".',
            },
            notes: {
                type: Type.STRING,
                description: 'Uma breve observação, trecho do post, ou a hashtag sugerida.'
            }
          },
          required: ['companyName', 'contactInfo', 'notes'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: leadSchema,
            }
        });

        const jsonText = response.text.trim();
        const leads = JSON.parse(jsonText);
        return leads;
    } catch (error) {
        console.error("Erro ao buscar leads:", error);
        throw new Error("Falha ao buscar leads. A IA pode não ter conseguido encontrar contatos para esta pesquisa.");
    }
}