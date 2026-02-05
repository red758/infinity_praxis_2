
import { GoogleGenAI, Type } from "@google/genai";
import { Review, ShopperSegment, MerchandisingRecommendation, LearnedDomainContext, CampaignManifest } from "../types";

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class SafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafetyError";
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message?.toLowerCase() || "";
      const status = error?.status || 0;

      // Handle typical Netlify/Production auth failures
      if (status === 401 || errorMessage.includes('api_key_invalid') || errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        throw new AuthError("API Authentication Failed: Ensure your key is named exactly API_KEY in Netlify and you have re-deployed.");
      }
      
      if (status === 404 || errorMessage.includes('model not found') || errorMessage.includes('404')) {
        throw new Error("Model Unavailable: The AI model requested is currently offline.");
      }

      if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
        throw new SafetyError("Content Blocked: The dataset contains patterns rejected by AI safety guardrails.");
      }

      const isRateLimit = status === 429 || 
                          errorMessage.includes('resource_exhausted') || 
                          errorMessage.includes('quota') ||
                          errorMessage.includes('429');
      
      if (isRateLimit) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new QuotaError("Rate Limit: Google Gemini API quota exceeded for this project.");
      }
      throw error;
    }
  }
  throw lastError;
}

const getAi = () => {
  // Directly access process.env.API_KEY as per system instruction
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    // We throw a clear AuthError to trigger the specialized UI in App.tsx
    throw new AuthError("ENV_VAR_MISSING: The application requires a variable named exactly 'API_KEY'. Please rename 'GEMINI_API_KEY' if that is what you used.");
  }
  return new GoogleGenAI({ apiKey });
};

const PROBABILISTIC_GUARDRAILS = `
CORE ANALYTICS RULES:
1. MANDATORY DATA ANCHOR: DO NOT USE PRE-EXISTING KNOWLEDGE OR MOCK DATA. 
2. INSIGHTS MUST BE 100% DERIVED FROM THE PROVIDED TELEMETRY STREAM.
3. IF DATA IS INSUFFICIENT, EXTRAPOLATE LOGICALLY BASED ONLY ON THE PROVIDED VARIABLES.
4. NO GENERIC MOCK SEGMENTS LIKE "CONSCIOUS CONSUMERS". DEDUCE NEW NAMES FROM DATA.
`;

export const generateCampaignManifest = async (segment: ShopperSegment, context: LearnedDomainContext | null): Promise<CampaignManifest> => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      ACT AS A SENIOR GROWTH ENGINEER.
      CONTEXT: ${context?.domainName || 'General Retail'}.
      TARGET SEGMENT: ${segment.name}.
      DATA SIGNALS: ${JSON.stringify(segment.affinityScores)}.
      
      TASK: Generate a technical Tactical Activation Manifest.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activationPlan: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { step: { type: Type.STRING }, status: { type: Type.STRING }, delay: { type: Type.STRING } },
                required: ['step', 'status', 'delay']
              } 
            },
            technicalHook: { type: Type.STRING },
            adCopyDraft: { type: Type.STRING },
            implementationJson: { type: Type.STRING },
            projectedMetrics: {
              type: Type.OBJECT,
              properties: { conversionLift: { type: Type.STRING }, roi: { type: Type.STRING }, reach: { type: Type.STRING }, volatilityRisk: { type: Type.STRING } },
              required: ['conversionLift', 'roi', 'reach', 'volatilityRisk']
            }
          },
          required: ['activationPlan', 'technicalHook', 'adCopyDraft', 'implementationJson', 'projectedMetrics']
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const synthesizeDomainDNA = async (dataSample: any[], headers: string[], existingContext: LearnedDomainContext | null) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Consumer Analytics Engine. 
      ${PROBABILISTIC_GUARDRAILS}
      TASK: Synthesize portable "Neural Domain DNA".
      ANALYZE HEADERS: ${headers.join(', ')}
      SAMPLE DATA: ${JSON.stringify(dataSample.slice(0, 10))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            domainName: { type: Type.STRING },
            coreLexicon: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyBehavioralRules: { type: Type.ARRAY, items: { type: Type.STRING } },
            behavioralWeights: { 
              type: Type.ARRAY, 
              items: { type: Type.OBJECT, properties: { feature: { type: Type.STRING }, weight: { type: Type.NUMBER } }, required: ['feature', 'weight'] }
            },
            latentCorrelators: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, result: { type: Type.STRING }, logic: { type: Type.STRING } }, required: ['trigger', 'result', 'logic'] }
            },
            segmentPrototypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            historicalFrictionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            maturityIndex: { type: Type.NUMBER }
          },
          required: ['domainName', 'coreLexicon', 'behavioralWeights', 'latentCorrelators', 'maturityIndex']
        }
      }
    });
    const dnaResult = JSON.parse(response.text);
    const behavioralWeights: Record<string, number> = {};
    if (Array.isArray(dnaResult.behavioralWeights)) {
      dnaResult.behavioralWeights.forEach((bw: any) => { behavioralWeights[bw.feature] = bw.weight; });
    }
    return { ...dnaResult, behavioralWeights, lastLearnedDate: new Date().toISOString(), version: "2.4.0-PRO" } as LearnedDomainContext;
  });
};

export const discoverSegments = async (dataSample: any[], headers: string[], context: LearnedDomainContext | null) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${PROBABILISTIC_GUARDRAILS}
      TASK: Perform probabilistic clustering. 
      TELEMETRY: ${JSON.stringify(dataSample)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              behavioralRationale: { type: Type.STRING },
              characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
              affinityScores: { 
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, value: { type: Type.NUMBER } }, required: ['key', 'value'] }
              },
              kpis: {
                type: Type.OBJECT,
                properties: { estimatedAOV: { type: Type.STRING }, clvPotential: { type: Type.STRING }, retentionLikelihood: { type: Type.NUMBER }, churnPropensity: { type: Type.NUMBER } },
                required: ['estimatedAOV', 'clvPotential', 'retentionLikelihood', 'churnPropensity']
              },
              growthTrend: { type: Type.STRING },
              preferredChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
              sampleSize: { type: Type.NUMBER },
              patternStabilityIndex: { type: Type.NUMBER }, 
              volatilityIndex: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    
    const results = JSON.parse(response.text);
    return results.map((s: any) => {
      const affinityScores: Record<string, number> = {};
      if (Array.isArray(s.affinityScores)) { s.affinityScores.forEach((item: any) => { affinityScores[item.key] = item.value; }); }
      return { ...s, affinityScores, status: 'Discovery', lastUpdated: new Date().toISOString(), dataSource: 'live' };
    }) as ShopperSegment[];
  });
};

export const generateMerchandisingRecommendations = async (segments: ShopperSegment[], context: LearnedDomainContext | null) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${PROBABILISTIC_GUARDRAILS}
      TASK: Identify 5 merchandising plays.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              targetSegment: { type: Type.STRING },
              action: { type: Type.STRING },
              rationale: { type: Type.STRING },
              roiProjection: { type: Type.STRING },
              metricLift: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } },
              strategyType: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              complexity: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text) as MerchandisingRecommendation[];
  });
};

export const getPersonaDetails = async (segment: ShopperSegment, context: LearnedDomainContext | null) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${PROBABILISTIC_GUARDRAILS}
      Synthesize behavior-inferred patterns for: ${segment.name}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { backstory: { type: Type.STRING }, motivation: { type: Type.STRING }, churnRisks: { type: Type.STRING } }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const analyzeFriction = async (segment: ShopperSegment, reviews: Review[]) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform high-fidelity friction analysis for segment ${segment.name}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { frictionScore: { type: Type.NUMBER }, primaryGaps: { type: Type.ARRAY, items: { type: Type.STRING } } }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateContextualReviews = async (segments: ShopperSegment[], context: LearnedDomainContext | null) => {
  return withRetry(async () => {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize 10 feedback logs matching: ${segments.map(s => s.name).join(', ')}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.STRING }, rating: { type: Type.NUMBER }, text: { type: Type.STRING }, category: { type: Type.STRING } }
          }
        }
      }
    });
    return (JSON.parse(response.text) as Review[]).map(r => ({ ...r, dataSource: 'live' }));
  });
};
