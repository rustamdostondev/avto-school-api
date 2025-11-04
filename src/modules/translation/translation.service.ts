import { Injectable, BadRequestException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import lotinKirill from 'lotin-kirill';

export enum SupportedLanguages {
  UZBEK_LATIN = 'uz',
  UZBEK_CYRILLIC = 'uz-cyrl',
  RUSSIAN = 'ru',
  ENGLISH = 'en',
}

export interface TranslationRequest {
  text: string;
  targetLanguage?: SupportedLanguages;
  sourceLanguage?: string;
  timeout?: number;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string;
}

export interface MultiTranslationResponse {
  originalText: string;
  sourceLanguage: string;
  translations: {
    oz: string;
    uz: string;
    ru: string;
  };
}

@Injectable()
export class TranslationService {
  private readonly defaultSourceLanguage = 'auto';
  private readonly defaultTargetLanguage = SupportedLanguages.UZBEK_LATIN;
  private readonly defaultTimeout = 5000;

  constructor() {}

  private async makeGoogleTranslateRequest(
    targetLanguage: string,
    sourceLanguage: string,
    text: string,
    timeout: number,
  ): Promise<{ translatedText: string; detectedLanguage?: string }> {
    try {
      const escapedText = encodeURIComponent(text);
      const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${escapedText}`;

      const response: AxiosResponse = await axios.get(url, {
        timeout,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; GoogleTranslate)',
        },
      });

      const result = response.data;

      if (!result || !Array.isArray(result) || !result[0] || !Array.isArray(result[0])) {
        throw new Error('Translation failed - invalid response format');
      }

      const translatedText = result[0][0][0];
      const detectedLanguage = result[2];

      if (!translatedText) {
        throw new Error('Translation failed - no translation found');
      }

      return { translatedText, detectedLanguage };
    } catch (error) {
      throw error;
    }
  }

  private convertCyrillicToLatin(text: string): string {
    const transliterator = new lotinKirill();
    return transliterator.toLatin(text);
  }

  private convertLatinToCyrillic(text: string): string {
    const transliterator = new lotinKirill();
    return transliterator.toCyrillic(text);
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, targetLanguage, sourceLanguage, timeout } = request;
    const tl = targetLanguage || this.defaultTargetLanguage;
    const sl = sourceLanguage || this.defaultSourceLanguage;
    const to = timeout || this.defaultTimeout;

    if (text.length > 5000) {
      throw new BadRequestException(
        `Text too long. Maximum 5000 characters allowed. (${text.length} characters provided)`,
      );
    }

    try {
      let translatedText: string;
      let detectedLanguage: string;

      // Handle Uzbek Cyrillic conversion
      if (tl === SupportedLanguages.UZBEK_CYRILLIC) {
        // First translate to Uzbek Latin, then convert to Cyrillic
        const latinResult = await this.makeGoogleTranslateRequest(
          SupportedLanguages.UZBEK_LATIN,
          sl,
          text,
          to,
        );
        translatedText = this.convertLatinToCyrillic(latinResult.translatedText);
        detectedLanguage = latinResult.detectedLanguage;
      } else {
        const result = await this.makeGoogleTranslateRequest(tl, sl, text, to);
        translatedText = result.translatedText;
        detectedLanguage = result.detectedLanguage;
      }

      return {
        originalText: text,
        translatedText,
        sourceLanguage: sl,
        targetLanguage: tl,
        detectedLanguage,
      };
    } catch (error) {
      throw new BadRequestException(`Translation failed: ${error.message}`);
    }
  }

  async translateToMultiple(
    text: string,
    sourceLanguage?: string,
  ): Promise<MultiTranslationResponse> {
    const sl = sourceLanguage || this.defaultSourceLanguage;

    if (text.length > 5000) {
      throw new BadRequestException(
        `Text too long. Maximum 5000 characters allowed. (${text.length} characters provided)`,
      );
    }

    try {
      // Translate to all supported languages in parallel
      const [uzbekLatinResult, russianResult] = await Promise.all([
        this.makeGoogleTranslateRequest(
          SupportedLanguages.UZBEK_LATIN,
          sl,
          text,
          this.defaultTimeout,
        ),
        this.makeGoogleTranslateRequest(SupportedLanguages.RUSSIAN, sl, text, this.defaultTimeout),
      ]);

      // Convert Uzbek Latin to Cyrillic
      const uzbekCyrillic = this.convertLatinToCyrillic(uzbekLatinResult.translatedText);

      return {
        originalText: text,
        sourceLanguage: sl,
        translations: {
          oz: uzbekLatinResult.translatedText,
          uz: uzbekCyrillic,
          ru: russianResult.translatedText,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Multi-translation failed: ${error.message}`);
    }
  }

  async convertUzbekScript(text: string, targetScript: 'latin' | 'cyrillic'): Promise<string> {
    if (targetScript === 'latin') {
      return this.convertCyrillicToLatin(text);
    } else {
      return this.convertLatinToCyrillic(text);
    }
  }
}
