import { GoogleGenAI } from "@google/genai";
import { Database } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the client
const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * Identify the broader domain from a specific research description.
 */
export const identifyDomain = async (researchDescription: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
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

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "无法识别领域";
  } catch (error) {
    console.error("Error identifying domain:", error);
    throw new Error("Failed to identify domain. Please try manual input.");
  }
};

/**
 * Generate the advanced search string based on the user's requirements.
 */
export const generateSearchString = async (domain: string, database: Database): Promise<string> => {
  try {
    // We use a smarter model for complex logic generation
    const model = 'gemini-3-flash-preview'; 

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

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // Clean up if the model accidentally adds markdown
    let cleanText = response.text?.trim() || "";
    cleanText = cleanText.replace(/^```(sql|text)?/, '').replace(/```$/, '').trim();

    return cleanText;
  } catch (error) {
    console.error("Error generating search string:", error);
    throw new Error("Failed to generate search string.");
  }
};