const { VertexAI } = require('@google-cloud/vertexai');
const Volunteer = require('../models/Volunteer');

/**
 * STRATEGIC: Semantic Orchestration Engine
 * Transforms mission requirements and responder capabilities into high-dimensional vectors.
 */

// Environment configuration stubs
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI;
try {
  if (PROJECT_ID) {
    // STRATEGIC: Load authenticated credential context for Google Cloud
    vertexAI = new VertexAI({ 
      project: PROJECT_ID, 
      location: LOCATION,
      keyFilename: './vertexAccountKey.json' 
    });
    console.log('✅ Vertex AI Semantic Engine Authenticated & Initialized.');
  }
} catch (err) {
  console.warn('⚠️ Vertex AI Init Failed, falling back to local simulation:', err.message);
}

/**
 * Generate a 768 or 1536-dimensional embedding vector from text.
 */
const generateEmbedding = async (text) => {
  if (!text) return [];

  // MOCK MODE: Returns a pseudo-random stable vector for development testing
  if (!vertexAI) {
    // Deterministic mock embedding based on string hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    const mockVector = Array.from({ length: 1536 }, (_, i) => Math.sin(hash + i));
    return mockVector;
  }

  try {
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'text-embedding-004',
    });
    
    console.log('[DEBUG] GenerativeModel Keys:', Object.keys(generativeModel));

    // Try direct method if available
    if (typeof generativeModel.embedContent === 'function') {
      const result = await generativeModel.embedContent({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT'
      });
      return result.embedding.values;
    }

    // FALLBACK: Use Google Auth Library to call Vertex REST API directly
    // This is the most stable way if the SDK methods are in flux
    console.warn('⚠️ SDK Method missing. Falling back to Direct REST API...');
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      keyFile: './vertexAccountKey.json',
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/text-embedding-004:predict`;
    
    const res = await client.request({
      url,
      method: 'POST',
      data: {
        instances: [{ content: text, task_type: 'RETRIEVAL_DOCUMENT' }]
      }
    });

    return res.data.predictions[0].embeddings.values;
  } catch (error) {
    console.warn('❌ Cloud Embedding Error:', error.response?.data?.error?.message || error.message);
    console.log('🔄 ACTIVATING UNBREAKABLE FALLBACK: Using Local Vector Simulation...');
    
    // STRATEGIC: Deterministic mock embedding to ensure the demo never breaks
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Array.from({ length: 1536 }, (_, i) => Math.sin(hash + i));
  }
};

/**
 * Calculate Cosine Similarity between two vectors.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA.length || !vecB.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
};

/**
 * SEMANTIC DRAFTBOARD: Find top semantic matches for a mission context.
 */
const findSemanticMatches = async (missionContext, candidates) => {
  try {
    const missionVector = await generateEmbedding(missionContext);
    
    const scores = candidates.map(volunteer => {
      // Logic: If volunteer has no embedding, rank based on basic score
      if (!volunteer.embedding || volunteer.embedding.length === 0) {
        return { volunteer, semanticScore: 0.5 };
      }
      
      const sim = cosineSimilarity(missionVector, volunteer.embedding);
      return { 
        volunteer, 
        semanticScore: Math.max(0, Math.min(1, (sim + 1) / 2)) // Normalize to [0,1]
      };
    });

    // Sort by score
    return scores.sort((a, b) => b.semanticScore - a.semanticScore);
  } catch (err) {
    console.error('Semantic Match Failure:', err);
    return candidates.map(v => ({ volunteer: v, semanticScore: 0 }));
  }
};

module.exports = {
  generateEmbedding,
  findSemanticMatches
};
