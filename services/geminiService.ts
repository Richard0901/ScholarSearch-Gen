import { GoogleGenAI } from "@google/genai";
import { Database, ApiSettings, ApiProvider } from "../types";

// Helper for OpenAI Compatible API
async function callOpenAI(settings: ApiSettings, prompt: string): Promise<string> {
  const baseUrl = settings.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const url = `${baseUrl}/chat/completions`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.apiKey}`
  };

  const body = {
    model: settings.modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Helper for Google API
async function callGoogle(settings: ApiSettings | undefined, prompt: string): Promise<string> {
   const apiKey = settings?.apiKey || process.env.API_KEY;
   if (!apiKey) throw new Error("No API Key provided for Google Gemini");
   
   const ai = new GoogleGenAI({ apiKey });
   const model = settings?.modelName || 'gemini-3-flash-preview';

   const response = await ai.models.generateContent({
      model,
      contents: prompt,
   });

   return response.text || "";
}

// Unified call function
async function generateContent(prompt: string, settings?: ApiSettings): Promise<string> {
  if (settings?.provider === ApiProvider.OPENAI) {
    return callOpenAI(settings, prompt);
  } else {
    return callGoogle(settings, prompt);
  }
}

/**
 * Identify the broader domain from a specific research description.
 */
export const identifyDomain = async (researchDescription: string, settings?: ApiSettings): Promise<string> => {
  try {
    const prompt = `
      Task: Identify the immediate parent research field (上一级的大领域) or core subject for the following specific research content.
      
      Guidelines:
      1. AVOID overly broad disciplines like "Clinical Medicine" (临床医学), "Biology" (生物学), "Chemistry" (化学), "Engineering" (工程学), or "Computer Science" (计算机科学).
      2. Identify the specific subject matter that defines the research context.
      3. Return the result in the same language as the input (e.g., Chinese input -> Chinese output).
      
      Examples:
      Input: "我在研究老年脓毒症单核细胞衰老的课题"
      Output: 脓毒症
      
      Input: "锂离子电池的硅基负极"
      Output: 锂离子电池
      
      Input: "Deep learning based image recognition for autonomous driving"
      Output: Autonomous Driving
      
      Input: "${researchDescription}"
      
      Output Requirement: Return ONLY the name of the domain. Do not add any introductory text.
    `;

    const result = await generateContent(prompt, settings);
    return result.trim() || "无法识别领域";
  } catch (error) {
    console.error("Error identifying domain:", error);
    throw new Error("Failed to identify domain. Please check your API settings.");
  }
};

/**
 * Generate the advanced search string based on the user's requirements.
 */
export const generateSearchString = async (domain: string, database: Database, settings?: ApiSettings): Promise<string> => {
  try {
    // Specific formatting instructions based on DB
    let dbSpecificInstructions = "";
    if (database === Database.SCOPUS) {
      dbSpecificInstructions = `
      - Use "TITLE-ABS-KEY" for the inclusion part.
      - Use "AND NOT TITLE" for the exclusion part.
      - Format Example: TITLE-ABS-KEY("term1" OR "term2") AND NOT TITLE("unwanted term")
      `;
    } else if (database === Database.PUBMED) {
      dbSpecificInstructions = `
      - Use "[Title/Abstract]" for the inclusion part.
      - Use "NOT ...[Title]" for the exclusion part.
      - Use MeSH terms if highly relevant, but prioritize keywords with [Title/Abstract].
      - Format Example: ("term1"[Title/Abstract] OR "term2"[Title/Abstract]) NOT ("unwanted term"[Title])
      `;
    } else if (database === Database.CNKI) {
      dbSpecificInstructions = `
      - STRICTLY follow CNKI Professional Search syntax rules.
      - Fields: SU=Subject (Theme), TI=Title, KY=Keywords, AB=Abstract.
      - Logic Operators: 
        - AND: Use 'AND'
        - OR: Use '|' (vertical bar)
        - NOT: Use '!' (exclamation mark)
      - Syntax: 
        - Use single quotes for all terms, e.g., SU='term'.
        - Group terms with parentheses.
      - Structure:
        - Broad inclusion using Subject (SU) or Title (TI).
        - Exclusion using Title (TI).
      - Example: (SU='人工智能' | SU='深度学习') AND !TI='综述'
      `;
    } else if (database === Database.WOS) {
      dbSpecificInstructions = `
      - Use Web of Science Core Collection Advanced Search syntax.
      - Fields: TS=Topic (searches Title, Abstract, Author Keywords, Keywords Plus), TI=Title.
      - Operators: AND, OR, NOT.
      - Structure: TS=("term1" OR "term2") NOT TI=("unwanted")
      `;
    }

    const prompt = `
    我需要为"${domain}"领域做文献调研来选择研究方向。
    你觉得应该怎么设计可以直接用于${database}的高级检索式？要求如下：
    1、必须包含所有命名变体（同义词）；采用摘要级（Abstract/Title/Keywords/Topic）检索该领域。
    2、采用标题级排除（NOT TITLE）某些容易检索入的不相关文献。
    3、Return ONLY the search string code.
    
    Database Specific Syntax Rules (Follow these strictly):
    ${dbSpecificInstructions}

    Output Requirement:
    - Return ONLY the raw search string text. 
    - Do not use Markdown code blocks. 
    - Do not add explanations.
    `;

    const result = await generateContent(prompt, settings);

    // Clean up if the model accidentally adds markdown
    let cleanText = result.trim() || "";
    cleanText = cleanText.replace(/^```(sql|text)?/, '').replace(/```$/, '').trim();

    return cleanText;
  } catch (error) {
    console.error("Error generating search string:", error);
    throw new Error("Failed to generate search string. Please check your API settings.");
  }
};