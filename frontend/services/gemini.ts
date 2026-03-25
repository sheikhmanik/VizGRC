
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly in the constructor as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getRiskRecommendation = async (riskTitle: string, category: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As a GRC expert, provide a concise 2-3 sentence mitigation strategy for a risk titled "${riskTitle}" in the "${category}" category.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate AI recommendation at this time.";
  }
};

export const generateControlFromDescription = async (name: string, description: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given this control name "${name}" and description: "${description}", suggest the appropriate GRC metadata. Format as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            controlDescription: { 
              type: Type.STRING,
              description: 'Detailed description of the control implementation.'
            },
            controlType: { 
              type: Type.STRING,
              description: 'One of: Preventive, Detective, Corrective.'
            },
            category: {
              type: Type.STRING,
              description: 'One of: Technical, Administrative, Physical.'
            },
            effort: {
              type: Type.STRING,
              description: 'One of: Low, Medium, High.'
            },
            frequency: { 
              type: Type.STRING,
              description: 'Execution frequency: Daily, Weekly, Monthly, Quarterly, or Annual.'
            }
          },
          propertyOrdering: ['controlDescription', 'controlType', 'category', 'effort', 'frequency']
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
