import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

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
    uzbek_latin: string;
    uzbek_cyrillic: string;
    russian: string;
  };
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly defaultSourceLanguage = 'auto';
  private readonly defaultTargetLanguage = SupportedLanguages.UZBEK_LATIN;
  private readonly defaultTimeout = 5000;

  // Cyrillic to Latin mapping for Uzbek
  private readonly cyrillicToLatinMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'j',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'x',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'i',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ў: 'oʻ',
    қ: 'q',
    ғ: 'gʻ',
    ҳ: 'h',
    ҷ: 'j',
    ң: 'ng',
  };

  // Latin to Cyrillic mapping for Uzbek
  private readonly latinToCyrillicMap: Record<string, string> = {
    a: 'а',
    b: 'б',
    v: 'в',
    g: 'г',
    d: 'д',
    e: 'е',
    j: 'ж',
    z: 'з',
    i: 'и',
    y: 'й',
    k: 'к',
    l: 'л',
    m: 'м',
    n: 'н',
    o: 'о',
    p: 'п',
    r: 'р',
    s: 'с',
    t: 'т',
    u: 'у',
    f: 'ф',
    x: 'х',
    ch: 'ч',
    sh: 'ш',
    yu: 'ю',
    ya: 'я',
    oʻ: 'ў',
    q: 'қ',
    gʻ: 'ғ',
    h: 'ҳ',
    ng: 'ң',
  };

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
        this.logger.error('Invalid response format from Google Translate');
        throw new Error('Translation failed - invalid response format');
      }

      const translatedText = result[0][0][0];
      const detectedLanguage = result[2];

      if (!translatedText) {
        this.logger.error('No translation found in response');
        throw new Error('Translation failed - no translation found');
      }

      this.logger.debug(`Translated text: ${translatedText}`);
      this.logger.debug(`Detected language: ${detectedLanguage || 'unknown'}`);

      return { translatedText, detectedLanguage };
    } catch (error) {
      this.logger.error(`Translation request failed: ${error.message}`);
      throw error;
    }
  }

  private convertCyrillicToLatin(text: string): string {
    let result = text;

    // Handle multi-character mappings first (case-insensitive)
    result = result.replace(/щ/gi, (match) => (match === 'Щ' ? 'Shch' : 'shch'));
    result = result.replace(/ч/gi, (match) => (match === 'Ч' ? 'Ch' : 'ch'));
    result = result.replace(/ш/gi, (match) => (match === 'Ш' ? 'Sh' : 'sh'));
    result = result.replace(/ю/gi, (match) => (match === 'Ю' ? 'Yu' : 'yu'));
    result = result.replace(/я/gi, (match) => (match === 'Я' ? 'Ya' : 'ya'));
    result = result.replace(/ё/gi, (match) => (match === 'Ё' ? 'Yo' : 'yo'));
    result = result.replace(/ң/gi, (match) => (match === 'Ң' ? 'Ng' : 'ng'));
    result = result.replace(/ў/gi, (match) => (match === 'Ў' ? 'Oʻ' : 'oʻ'));
    result = result.replace(/ғ/gi, (match) => (match === 'Ғ' ? 'Gʻ' : 'gʻ'));
    result = result.replace(/ц/gi, (match) => (match === 'Ц' ? 'Ts' : 'ts'));

    // Handle single character mappings with case preservation
    for (const [cyrillic, latin] of Object.entries(this.cyrillicToLatinMap)) {
      if (cyrillic.length === 1 && latin.length === 1) {
        const upperCyrillic = cyrillic.toUpperCase();
        const upperLatin = latin.toUpperCase();

        // Replace uppercase
        result = result.replace(new RegExp(upperCyrillic, 'g'), upperLatin);
        // Replace lowercase
        result = result.replace(new RegExp(cyrillic, 'g'), latin);
      }
    }

    return result;
  }

  private convertLatinToCyrillic(text: string): string {
    let result = text;

    // Handle multi-character mappings first (case-insensitive, order matters)
    result = result.replace(/shch/gi, (match) => {
      if (match === 'SHCH') return 'Щ';
      if (match === 'Shch') return 'Щ';
      return 'щ';
    });
    result = result.replace(/ch/gi, (match) => {
      if (match === 'CH') return 'Ч';
      if (match === 'Ch') return 'Ч';
      return 'ч';
    });
    result = result.replace(/sh/gi, (match) => {
      if (match === 'SH') return 'Ш';
      if (match === 'Sh') return 'Ш';
      return 'ш';
    });
    result = result.replace(/yu/gi, (match) => {
      if (match === 'YU') return 'Ю';
      if (match === 'Yu') return 'Ю';
      return 'ю';
    });
    result = result.replace(/ya/gi, (match) => {
      if (match === 'YA') return 'Я';
      if (match === 'Ya') return 'Я';
      return 'я';
    });
    result = result.replace(/ng/gi, (match) => {
      if (match === 'NG') return 'Ң';
      if (match === 'Ng') return 'Ң';
      return 'ң';
    });
    result = result.replace(/oʻ/gi, (match) => {
      if (match === 'Oʻ' || match === 'Oʻ') return 'Ў';
      return 'ў';
    });
    result = result.replace(/gʻ/gi, (match) => {
      if (match === 'Gʻ' || match === 'Gʻ') return 'Ғ';
      return 'ғ';
    });

    // Handle single character mappings with case preservation
    for (const [latin, cyrillic] of Object.entries(this.latinToCyrillicMap)) {
      if (latin.length === 1) {
        const upperLatin = latin.toUpperCase();
        const upperCyrillic = cyrillic.toUpperCase();

        // Replace uppercase
        result = result.replace(new RegExp(upperLatin, 'g'), upperCyrillic);
        // Replace lowercase
        result = result.replace(new RegExp(latin, 'g'), cyrillic);
      }
    }

    return result;
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
          uzbek_latin: uzbekLatinResult.translatedText,
          uzbek_cyrillic: uzbekCyrillic,
          russian: russianResult.translatedText,
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
