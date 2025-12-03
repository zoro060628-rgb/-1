import { GoogleGenAI, Type } from "@google/genai";
import { ActionStep, StudyFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateActionPlan = async (goal: string): Promise<ActionStep[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a concrete action plan for the goal: "${goal}". Provide 3 to 5 steps.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
          },
          required: ['stepNumber', 'title', 'description', 'estimatedTime'],
        },
      },
    },
  });

  const steps = JSON.parse(response.text || '[]');
  return steps.map((step: any) => ({ ...step, isCompleted: false }));
};

export const evaluateStudyConcept = async (topic: string, explanation: string): Promise<StudyFeedback> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Evaluate this explanation of "${topic}": "${explanation}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          understandingLevel: { type: Type.STRING },
          missingConcepts: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          betterExplanation: { type: Type.STRING },
          encouragement: { type: Type.STRING },
        },
        required: ['score', 'understandingLevel', 'missingConcepts', 'betterExplanation', 'encouragement'],
      },
    },
  });
  
  return JSON.parse(response.text || '{}');
};