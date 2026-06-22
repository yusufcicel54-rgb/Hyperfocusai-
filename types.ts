export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface Settings {
  systemPrompt: string;
  rules: string;
  temperature: number;
  model: string;
}
