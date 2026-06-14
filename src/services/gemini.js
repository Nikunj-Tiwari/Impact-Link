import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// The new SDK uses GoogleGenAI and explicitly accepts the apiKey in the constructor options
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ── Tiered Model Strategy ─────────────────────────────────────────────────────
// Flash  → Real-time ETL, field ingestion, per-responder reasoning (low latency, high volume)
// Pro    → Strategic re-clustering, anomaly detection, alloc advice (5-min cadence, free tier: 2 RPM / 50 RPD)
const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL   = 'gemini-3-flash-preview';

// Pro cadence guard — prevent exceeding 2 RPM on free tier
let _lastProCall = 0;
const PRO_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

async function callProModel(contents, config = {}) {
  const now = Date.now();
  const timeSinceLastCall = now - _lastProCall;
  
  if (timeSinceLastCall < PRO_COOLDOWN_MS) {
    console.warn(`[Gemini] Pro model rate-limited. Falling back to Flash model.`);
    const response = await ai.models.generateContent({ model: FLASH_MODEL, contents, ...config });
    return response;
  }
  
  _lastProCall = now;
  try {
    const response = await ai.models.generateContent({ model: PRO_MODEL, contents, ...config });
    return response;
  } catch (err) {
    console.warn(`[Gemini] Pro model call failed (${err.message || 'Unknown error'}). Falling back to Flash model.`);
    const response = await ai.models.generateContent({ model: FLASH_MODEL, contents, ...config });
    return response;
  }
}

/**
 * Gemini OCR Layer (Vision) — Flash
 * Extracts structured JSON from image of a field report.
 */
export async function extractDataFromReport(imageFile) {
  const prompt = `
    Analyze this field report image. This could be a handwritten paper survey, a printed NGO campaign report, or notes from a mobile aid team. 
    Your goal is to extract structured data to identify **resource misallocation**—where needs are high but local aid is fragmented or missing.
    **Geographic Focus: Indian sectors, districts, and neighborhoods.**
    
    Return a clean JSON object with:
    - location: string (Indian sector/neighborhood name)
    - needType: string (Medical, Food, Water, Infrastructure, or Shelter)
    - severity: number (1-10, scale of human impact/suffering)
    - frequency: number (1-10, indicates how many separate reports or groups are flagging this area)
    - resourceGap: number (1-10, mismatch between currently available aid vs what is actually needed)
    - timeSensitivity: number (1-10, urgency for intervention)
    
    Look for keywords like "zero supplies", "no help", "NGO overlap", "duplicated effort", or "completely bypassed".
    If data is missing, use context clues or 5.0 as default.
    Return ONLY valid JSON.
  `;

  try {
    const imageData = await fileToGenerativePart(imageFile);
    
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            imageData
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    // Log the full response for debugging
    console.info("Gemini Raw Response:", response.text);
    
    let text = response.text;
    
    if (!text) {
      throw new Error("Gemini returned an empty response. The image might be unreadable or contain restricted content.");
    }

    // Clean up any potential markdown code blocks returned despite the mimeType setting
    text = text.trim();
    if (text.startsWith('```json')) text = text.substring(7);
    else if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Gemini JSON Parsing Error on text:", text);
      throw new Error("AI returned malformed data. Please try again.");
    }
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Invalid Gemini API Key. Please check your .env.local configuration.");
    }
    throw error;
  }
}

/**
 * Gemini Strategic Reasoning Layer — Flash (per-incident, fast)
 * Generates tactical advice based on mathematical scores.
 */
export async function getStrategicAdvice(incidentData, priorityScore) {
  const prompt = `
    As a disaster relief strategist focusing on Indian regional impact, analyze this incident:
    Location: ${incidentData.location}
    Need: ${incidentData.needType}
    Priority Score: ${priorityScore} / 10
    
    Current Metrics:
    - Severity: ${incidentData.severity}
    - Resource Gap: ${incidentData.resourceGap}
    
    Task: Provide 3 concise, actionable tactical recommendations for this Indian localized context.
    Also, summarize the "What-If" impact if 5 more volunteers are deployed here.
    Keep the tone professional and urgent.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Reasoning Error:", error);
    throw error;
  }
}

import { getBeneficiaryUrgency } from './logic';

/**
 * Gemini Strategic Advisory Layer — Pro
 * Slow-cadence (5-min cooldown). Analyzes top beneficiaries for macro shifts.
 */
export async function getGlobalStrategicAdvice(beneficiaries) {
  const top = beneficiaries
    .slice()
    .sort((a, b) => getBeneficiaryUrgency(b) - getBeneficiaryUrgency(a))
    .slice(0, 20);

  const beneficiarySummary = top.map(b =>
    `[${b.primaryNeed || 'General'}] ${b.village || b.district || `Lat:${(b.geo?.lat||0).toFixed(2)},Lng:${(b.geo?.lng||0).toFixed(2)}`} | Urgency:${getBeneficiaryUrgency(b)}`
  ).join('\n');

  const prompt = `You are the Lead AI Strategist for ImpactLink, a humanitarian crisis coordination platform.

Analyze these ${top.length} most critical beneficiaries/needs (sorted by urgency):
${beneficiarySummary}

Respond with ONLY a valid JSON object (no markdown, no code blocks). Use this exact schema:
{
  "hotspot": {
    "location": "Name of worst misallocation zone",
    "reason": "One sentence explaining why this zone is the hotspot",
    "severity_score": 8.5,
    "risk_level": "CRITICAL"
  },
  "lateral_shift": {
    "from_zone": "Source zone with surplus resources",
    "to_zone": "Target zone that needs resources",
    "resource_type": "What type of resource to move (Medical Teams / Food Supplies / etc)",
    "estimated_impact": "One sentence on expected outcome"
  },
  "tactical_summary": "Two sentence overall orchestration status and key strategic recommendation.",
  "recommended_actions": [
    "Action item 1 (specific and actionable)",
    "Action item 2",
    "Action item 3"
  ],
  "system_threat_level": "LOW | MODERATE | HIGH | CRITICAL"
}`;

  try {
    const response = await callProModel(prompt);
    return response.text;
  } catch (error) {
    console.error("Gemini Global Reasoning Error:", error);
    if (error.message?.includes('rate-limited')) throw error;
    throw error;
  }
}


/**
 * Gemini Natural Language Ingestion Layer — Flash
 * Converts a text description into a structured incident object.
 */
export async function smartParseIncident(text) {
  const prompt = `
    Analyze this text from the field in India: "${text}"
    
    Convert it into a valid JSON incident object for the India ImpactLink dashboard.
    Required fields:
    - location: string (e.g. "Mumbai Sector 4", "Delhi Slums")
    - needType: string (Medical, Food, Water, Infrastructure, or Shelter)
    - severity: number (1-10)
    - frequency: number (1-10, scale of reports)
    - resourceGap: number (1-10, mismatch of aid)
    - timeSensitivity: number (1-10)
    
    Constraint: If a field is not mentioned, use 5 as default. Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });
    const jsonText = response.text;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Gemini Smart Parse Error:", error);
    throw error;
  }
}

/**
 * Gemini Orchestration Reasoning — Flash
 * Provides a 1-sentence justification for a specific responder match.
 */
export async function getMatchReasoning(responder, incident) {
  const prompt = `
    Briefly explain why ${responder.name} is a strong match for this ${incident.needType || incident.eventType} incident.
    Reasoning factors: Performance Score (${responder.performanceScore || 85}%), Proximity (${responder.distanceKm?.toFixed(1) ?? responder.distanceVal?.toFixed(1) ?? '?'}km), and top skill (${responder.topSkill || responder.skill || responder.skills?.[0] || 'General'}).
    Keep it to exactly ONE short, professional sentence.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    return "Prioritized based on multi-factor proximity and skill matching.";
  }
}

/**
 * Gemini Impact Simulation — Flash
 * Projects the outcome of assigning N volunteers to an incident.
 */
export async function getImpactSimulation(incident, volunteerCount) {
  const prompt = `
    Analyze the impact of deploying ${volunteerCount} volunteers to this disaster incident in India:
    Location: ${incident.location}
    Type: ${incident.needType || incident.eventType}
    Current Severity: ${incident.severity}/10
    Current Resource Gap: ${incident.resourceGap}/10

    Task:
    1. Calculate a "Simulated Severity Score" (0-10) after deployment.
    2. Provide a 2-sentence "AI Projection" of the recovery outcome.
    3. Estimate a "Success Probability" percentage.

    Return ONLY a JSON object: { "newScore": number, "projection": "string", "successRate": number }
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });
    const jsonMatch = response.text.match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Simulation Error:", error);
    return null;
  }
}

/**
 * Gemini Temporal Orchestration — Flash
 * Converts natural language description into structured mission phases and dates.
 */
export async function generateTimelinePhases(description) {
  const prompt = `
    Analyze this mission orchestration request: "${description}"
    Current Date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)
    
    Task: Extract or infer a logical 3-5 phase operational timeline and determine the overall project dates.
    
    Robustness Rules:
    1. If the input is vague (e.g., "help", "do something fast", "rapid deployment"), INFER a standard high-impact relief cycle: 
       - Phase 1: Rapid Assessment (3 days)
       - Phase 2: Emergency Distribution (14 days)
       - Phase 3: Post-Impact Monitoring (10 days)
    2. If no start date is mentioned, use the Current Date.
    3. Calculate the endDate by summing all phase durations from the startDate.
    4. ONLY if the input is completely off-topic (e.g. asking for a recipe, jokes, or code unrelated to missions), set "isOffTopic" to true.
    
    Return ONLY a valid JSON object: 
    { 
      "startDate": "YYYY-MM-DD", 
      "endDate": "YYYY-MM-DD", 
      "phases": [{ "name": string, "durationDays": number }],
      "isOffTopic": boolean
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let text = response.text.trim();
    if (text.startsWith('```json')) text = text.substring(7);
    else if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Gemini Timeline Generation Error:", error);
    // Ultimate fallback for technical failures
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      phases: [
        { name: "Emergency Response Initiation", durationDays: 7 },
        { name: "Sustained Aid Distribution", durationDays: 21 }
      ],
      isOffTopic: false
    };
  }
}

/**
 * AI Insight: Network Anomaly Detection → PRO model
 * Analyzes hubs for tactical anomalies.
 */
export async function getNetworkAnomalyAnalysis(hubs) {
  const hotspotDesc = hubs.map(c => 
    `Location Hub: ${c.name} - ${c.count} beneficiaries, avg urgency ${c.avgUrgency?.toFixed(1)}, avg score ${c.avgScore?.toFixed(1)}`
  ).join('\n');

  const prompt = `
    Analyze these beneficiary hubs from our disaster response network in India:
    
    ${hotspotDesc}

    Task:
    Perform an "Anomaly Detection" scan. Identify if there is a severe anomaly (e.g. one hub having vastly more beneficiaries or disproportionately high urgency compared to others).
    Provide a concise 2-sentence tactical report. 
    1st sentence: State the integrity status (e.g., "Network Integrity Compromised" or "Network Integrity Optimal").
    2nd sentence: Describe the anomaly in operational terms.
    Keep it strictly professional and urgent.
  `;

  try {
    const response = await callProModel(prompt);
    return response.text;
  } catch (error) {
    console.error("Gemini Anomaly Detection Error:", error);
    
    if (error.message?.includes('rate-limited')) {
      return `Network Scan Paused.\n${error.message}`;
    }
    if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
      return "Network Scan Paused.\nFree tier API rate limit reached. Please wait 5 minutes before rescanning.";
    }
    if (error.message && error.message.includes('503')) {
      return "Cloud Engine Overloaded.\nGoogle's Gemini Pro models are currently experiencing high global demand. Please try scanning again shortly.";
    }

    return "Network Integrity Unknown.\nFailed to fetch live AI anomaly scan due to regional API latency.";
  }
}

/**
 * AI Insight: Predictive Bottlenecks → PRO model
 * Forecasts where resources will run out.
 */
export async function getPredictiveBottlenecks(hubs) {
  const topHubs = hubs.slice(0, 5).map(c => 
    `${c.name}: ${c.count} beneficiaries, urgency ${c.avgUrgency?.toFixed(1)}`
  ).join('\n');

  const prompt = `
    Analyze these highly active beneficiary hubs:
    ${topHubs}

    Task:
    Forecast the next major resource bottleneck in the next 48 hours.
    Provide exactly ONE short sentence identifying the hub and the impending risk.
    Keep it highly tactical.
  `;

  try {
    const response = await callProModel(prompt);
    return response.text;
  } catch (error) {
    return "Insufficient data to project 48-hour bottlenecks reliably.";
  }
}

/**
 * AI Insight: Lateral Shift Recommendations → PRO model
 * Recommends shifting resources between hubs.
 */
export async function getLateralShiftRecommendations(hubs) {
  if (hubs.length < 2) return "Insufficient hubs to calculate lateral shifts.";
  
  const hubDesc = hubs.slice(0, 8).map(c => 
    `${c.name}: Urgency ${c.avgUrgency?.toFixed(1)}, Score ${c.avgScore?.toFixed(1)}`
  ).join('\n');

  const prompt = `
    Review the following hubs and their operational stress scores:
    ${hubDesc}

    Task:
    Recommend exactly ONE specific lateral shift (moving volunteers/resources from a low-stress hub to a high-stress hub).
    Return your recommendation in ONE concise, professional sentence (e.g. "Shift 3 medical volunteers from Hub A to Hub B to stabilize rising urgency.").
  `;

  try {
    const response = await callProModel(prompt);
    return response.text;
  } catch (error) {
    return "Lateral shift calculations are currently offline.";
  }
}

/**
 * AI Strategic Reallocation Advice → PRO model
 * Called once after runAllocation() completes.
 * Provides macro-level strategic shifts based on engine output.
 */
export async function getStrategicReallocationAdvice(allocationResult) {
  const { assignments = [], dispatches = [], criticalUnmet = [] } = allocationResult;
  const unmetDesc = criticalUnmet.map(m =>
    `${m.location || m.eventType} (Sev: ${m.severity}, Gap: ${m.resourceGap})`
  ).join('\n') || 'None';

  const prompt = `
    You are the ImpactLink Strategic AI reviewing the output of our two-pass allocation engine.

    Allocation Results:
    - Resident assignments (Pass 1): ${assignments.length}
    - Mobile dispatches (Pass 2): ${dispatches.length}
    - Critical Unmet Missions (no coverage found): ${criticalUnmet.length}

    Unmet Mission Details:
    ${unmetDesc}

    Task:
    1. In 2 sentences, assess the overall allocation health.
    2. Recommend ONE specific macro-level lateral shift to address the most critical unmet mission.
    3. Flag if volunteer density is insufficient at any hub (infer from unmet count).
    Keep advice sharp and operational.
  `;

  try {
    const response = await callProModel(prompt);
    return response.text;
  } catch (error) {
    console.error('Gemini Reallocation Advice Error:', error);
    if (error.message?.includes('rate-limited')) throw error;
    return 'Strategic advisory unavailable. Review critical-unmet panel manually.';
  }
}

/**
 * Converts File object to Gemini Vision format.
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        },
      });
    };
    reader.readAsDataURL(file);
  });
}
