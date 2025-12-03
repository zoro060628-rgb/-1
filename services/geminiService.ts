import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ActionStep, StudyFeedback, RoutinePlan } from "../types";

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * FEATURE 1: Proactivity
 * Breaks down a vague goal into actionable steps.
 */
export const generateActionPlan = async (goal: string): Promise<ActionStep[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        stepNumber: { type: Type.INTEGER },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        estimatedTime: { type: Type.STRING },
      },
      required: ["stepNumber", "title", "description", "estimatedTime"],
    },
  };

  const prompt = `
    사용자가 다음 목표를 달성하고 싶어합니다: "${goal}".
    이 목표를 달성하기 위해 아주 구체적이고 실행 가능한 3~5개의 단계로 나누어주세요.
    사용자가 '적극성'을 발휘할 수 있도록 동기를 부여하는 톤으로 작성해주세요.
    한국어로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as ActionStep[];
  } catch (error) {
    console.error("Error generating action plan:", error);
    throw new Error("목표 계획을 생성하는 중 오류가 발생했습니다.");
  }
};

/**
 * FEATURE 2: Study/Understanding (Feynman Technique)
 * Evaluates the user's explanation of a concept.
 */
export const evaluateStudyConcept = async (topic: string, explanation: string): Promise<StudyFeedback> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "0 to 100 score" },
      understandingLevel: { type: Type.STRING, description: "Beginner, Intermediate, or Advanced" },
      missingConcepts: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of key concepts missed or misunderstood"
      },
      betterExplanation: { type: Type.STRING, description: "A clearer, simpler explanation (Feynman technique style)" },
      encouragement: { type: Type.STRING, description: "Positive feedback" },
    },
    required: ["score", "understandingLevel", "missingConcepts", "betterExplanation", "encouragement"],
  };

  const prompt = `
    사용자가 '${topic}'에 대해 다음과 같이 설명했습니다:
    "${explanation}"

    당신은 친절하지만 예리한 튜터입니다. 
    1. 사용자의 이해도를 100점 만점으로 평가하세요.
    2. 빠뜨린 핵심 개념이나 잘못 이해한 부분이 있다면 지적해주세요.
    3. '파인만 기법'을 사용하여 이 개념을 더 쉽고 명확하게 다시 설명해주세요.
    4. 격려의 말을 덧붙여주세요.
    한국어로 응답해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as StudyFeedback;
  } catch (error) {
    console.error("Error evaluating study concept:", error);
    throw new Error("학습 내용을 분석하는 중 오류가 발생했습니다.");
  }
};

/**
 * FEATURE 3: Lifestyle/Routine
 * Generates a daily routine based on user inputs.
 */
export const generateDailyRoutine = async (
  wakeUpTime: string, 
  bedTime: string, 
  focusAreas: string[]
): Promise<RoutinePlan> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            activity: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Exercise', 'Study', 'Rest', 'Work', 'Meal'] },
            note: { type: Type.STRING },
          },
          required: ["time", "activity", "category", "note"],
        },
      },
      tips: { type: Type.STRING },
    },
    required: ["title", "items", "tips"],
  };

  const prompt = `
    사용자의 생활 리듬을 개선하기 위한 하루 일과표를 만들어주세요.
    
    기상 시간: ${wakeUpTime}
    취침 시간: ${bedTime}
    집중하고 싶은 분야: ${focusAreas.join(", ")}
    
    규칙적인 운동과 효율적인 공부 시간이 포함되도록 배치해주세요. 
    '번아웃'을 방지하기 위한 휴식 시간도 적절히 넣어주세요.
    한국어로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as RoutinePlan;
  } catch (error) {
    console.error("Error generating routine:", error);
    throw new Error("루틴을 생성하는 중 오류가 발생했습니다.");
  }
};