import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.join(__dirname, "../../.env.local");
const envFile = fs.readFileSync(envPath, "utf8");
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";

async function checkModels() {
  const ai = new GoogleGenAI({ apiKey });
  const candidates = [
    "text-embedding-004",
    "gemini-embedding-2"
  ];

  console.log("Testing GenAI models via default endpoint...");
  for (const model of candidates) {
    try {
      await ai.models.generateContent({
        model: model,
        contents: "test"
      });
      console.log(`✅ [WORKS] ${model}`);
    } catch (err) {
      console.log(`❌ [FAILED] ${model} => ${err.message.split('\n')[0]}`);
    }
  }
}

checkModels();
