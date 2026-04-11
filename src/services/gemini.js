import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gemini OCR Layer (Vision)
 * Extracts structured JSON from image of a field report.
 */
export async function extractDataFromReport(imageFile) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    // Simple JSON extraction regex in case of markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
}

/**
 * Gemini Strategic Reasoning Layer
 * Generates tactical advice based on mathematical scores.
 */
export async function getStrategicAdvice(incidentData, priorityScore) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Reasoning Error:", error);
    throw error;
  }
}

/**
 * Gemini Strategic Reasoning Layer (Global)
 */
export async function getGlobalStrategicAdvice(incidents) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const incidentSummary = incidents.map(inc => 
    `${inc.location}: ${inc.needType} (Severity ${inc.severity}, Gap ${inc.resourceGap})`
  ).join('\n');

  const prompt = `
    You are the Lead Strategist for ImpactLink India. Analyze this set of active reports from across multiple Indian sectors:

    ${incidentSummary}

    Task:
    1. Identify the "Hotspot of Misallocation" within India.
    2. Suggest a "Lateral Resource Shift": Recommend moving resources from a less critical Indian area to a more critical one.
    3. Give a 2-sentence tactical summary of the overall orchestration status.
    
    Keep advice sharp, brief, and tactical. Focus on solving misallocation.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Global Reasoning Error:", error);
    throw error;
  }
}

/**
 * Gemini Natural Language Ingestion Layer
 * Converts a text description into a structured incident object.
 */
export async function smartParseIncident(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Gemini Smart Parse Error:", error);
    throw error;
  }
}

/**
 * Gemini Orchestration Reasoning
 * Provides a 1-sentence justification for a specific responder match.
 */
export async function getMatchReasoning(responder, incident) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Briefly explain why ${responder.name} is a strong match for this ${incident.needType} incident.
    Reasoning factors: Reliability (${responder.reliability}), Proximity (${responder.distanceVal.toFixed(1)}km), and Skill (${responder.skill}).
    Keep it to exactly ONE short, professional sentence.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    return "Prioritized based on multi-factor proximity and skill matching.";
  }
}

/**
 * Gemini Impact Simulation
 * Projects the outcome of assigning N volunteers to an incident.
 */
export async function getImpactSimulation(incident, volunteerCount) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze the impact of deploying ${volunteerCount} volunteers to this disaster incident in India:
    Location: ${incident.location}
    Type: ${incident.needType}
    Current Severity: ${incident.severity}/10
    Current Resource Gap: ${incident.resourceGap}/10

    Task:
    1. Calculate a "Simulated Severity Score" (0-10) after deployment.
    2. Provide a 2-sentence "AI Projection" of the recovery outcome.
    3. Estimate a "Success Probability" percentage.

    Return ONLY a JSON object: { "newScore": number, "projection": "string", "successRate": number }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Simulation Error:", error);
    return null;
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
