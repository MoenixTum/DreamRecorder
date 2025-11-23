import { GoogleGenAI, Type } from "@google/genai";
import { DreamAnalysisResult, DreamEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip base64 prefix if present
const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:audio\/\w+;base64,/, "");
};

export const analyzeDreamAudio = async (
  audioBase64: string, 
  mimeType: string
): Promise<DreamAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64(audioBase64),
            },
          },
          {
            text: `Please listen to this dream recording. 
            1. Transcribe the audio accurately. 
            2. Analyze the content to extract 3-5 short thematic tags (e.g., "Flying", "Water", "Chased").
            3. Determine the overall mood (one or two words).
            4. Estimate a lucidity score from 1 (completely unaware) to 10 (fully lucid/controlling).
            
            Return the result in JSON format.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            mood: { type: Type.STRING },
            lucidityScore: { type: Type.NUMBER },
          },
          required: ["transcription", "tags", "mood", "lucidityScore"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as DreamAnalysisResult;

  } catch (error) {
    console.error("Dream analysis failed:", error);
    // Fallback if AI fails
    return {
      transcription: "Analysis failed. Please try again later.",
      tags: ["Error"],
      mood: "Unknown",
      lucidityScore: 0,
    };
  }
};

export const generateDreamImage = async (transcription: string, mood: string): Promise<string | null> => {
  try {
    const prompt = `Create an artistic, ethereal, and dreamlike illustration of the following dream description. 
    Mood: ${mood}. 
    Dream: ${transcription}. 
    Art style: Digital fantasy art, soft lighting, moss and forest tones, surrealist, mysterious.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "4:3",
        },
      },
    });

    // Extract image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const interpretDreams = async (dreams: DreamEntry[]): Promise<string> => {
  try {
    const dreamContext = dreams.map(d =>
      `Date: ${new Date(d.timestamp).toLocaleDateString()}
       Mood: ${d.mood}
       Tags: ${d.tags.join(", ")}
       Content: ${d.transcription}`
    ).join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Here are several dreams from my journal:\n\n${dreamContext}\n\n
      Based on these dreams, please provide a psychological or symbolic interpretation.
      Identify common themes, recurring symbols, and potential emotional undercurrents.
      Answer the question: "Why am I dreaming about this?" in a supportive, insightful, and mystical tone.
      Keep the response concise (under 200 words) but profound.`,
    });

    return response.text || "Could not generate interpretation.";
  } catch (error) {
    console.error("Interpretation failed", error);
    return "Failed to interpret dreams. Please try again.";
  }
};
