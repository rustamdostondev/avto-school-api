import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  TranslationService,
  TranslationResponse,
  MultiTranslationResponse,
} from './translation.service';
import { TranslateDto, MultiTranslateDto, ConvertScriptDto } from './dto/translation.dto';

@ApiTags('Translation')
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate text to specified language',
    description:
      'Translates text from one language to another using Google Translate API. Supports Uzbek (Latin), Uzbek (Cyrillic), Russian, and English.',
  })
  @ApiResponse({
    status: 200,
    description: 'Translation successful',
    schema: {
      type: 'object',
      properties: {
        originalText: { type: 'string', example: 'Salom dunyo' },
        translatedText: { type: 'string', example: 'Привет мир' },
        sourceLanguage: { type: 'string', example: 'auto' },
        targetLanguage: { type: 'string', example: 'ru' },
        detectedLanguage: { type: 'string', example: 'uz' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input or translation failed',
  })
  async translate(@Body() translateDto: TranslateDto): Promise<TranslationResponse> {
    return this.translationService.translate({
      text: translateDto.text,
      targetLanguage: translateDto.targetLanguage,
      sourceLanguage: translateDto.sourceLanguage,
      timeout: translateDto.timeout,
    });
  }

  @Post('translate-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate text to multiple languages',
    description:
      'Translates Uzbek text to Uzbek (Latin), Uzbek (Cyrillic), and Russian simultaneously.',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-translation successful',
    schema: {
      type: 'object',
      properties: {
        originalText: { type: 'string', example: 'Salom dunyo' },
        sourceLanguage: { type: 'string', example: 'auto' },
        translations: {
          type: 'object',
          properties: {
            uzbek_latin: { type: 'string', example: 'Salom dunyo' },
            uzbek_cyrillic: { type: 'string', example: 'Салом дунё' },
            russian: { type: 'string', example: 'Привет мир' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input or translation failed',
  })
  async translateMultiple(
    @Body() multiTranslateDto: MultiTranslateDto,
  ): Promise<MultiTranslationResponse> {
    return this.translationService.translateToMultiple(
      multiTranslateDto.text,
      multiTranslateDto.sourceLanguage,
    );
  }

  @Post('convert-script')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert Uzbek text between Latin and Cyrillic scripts',
    description:
      'Converts Uzbek text from Latin to Cyrillic script or vice versa without using external translation services.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input',
  })
  async convertScript(@Body() convertScriptDto: ConvertScriptDto): Promise<{
    originalText: string;
    convertedText: string;
    sourceScript: string;
    targetScript: string;
  }> {
    const convertedText = await this.translationService.convertUzbekScript(
      convertScriptDto.text,
      convertScriptDto.targetScript,
    );

    return {
      originalText: convertScriptDto.text,
      convertedText,
      sourceScript: convertScriptDto.targetScript === 'latin' ? 'cyrillic' : 'latin',
      targetScript: convertScriptDto.targetScript,
    };
  }
}
