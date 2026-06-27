import { Injectable } from '@angular/core';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  async generateContent(prompt: string, useThinking = false) {
    const config: Record<string, unknown> = {};
    if (useThinking) {
      config['thinkingConfig'] = { thinkingLevel: ThinkingLevel.HIGH };
    }

    return await this.ai.models.generateContent({
      model: useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config
    });
  }

  async searchAndGenerate(prompt: string) {
    return await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
  }
}
