export interface DreamEntry {
  id: string;
  timestamp: number;
  audioBlob?: Blob; // Not stored in localStorage, handled in memory/IndexedDB in real app. For this demo we might just keep text or temporary URL.
  audioBase64?: string; // Storing small clips as base64 for simplicity in this demo environment.
  transcription: string;
  tags: string[];
  mood: string;
  lucidityScore: number;
  isProcessing: boolean;
  generatedImage?: string; // Base64 string of the generated image
}

export interface DreamAnalysisResult {
  transcription: string;
  tags: string[];
  mood: string;
  lucidityScore: number;
}

export type AppView = 'home' | 'list' | 'interpretation';

export interface AppSettings {
  autoTranscribe: boolean;
  themeIntensity: number; // 0 to 1
}