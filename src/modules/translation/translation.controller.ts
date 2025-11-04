import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Translate text to specified language',
    description:
      'Translates text from one language to another using Google Translate API. Supports Uzbek (Latin), Uzbek (Cyrillic), Russian, and English.',
  })
  async translate(@Body() translateDto: TranslateDto): Promise<TranslationResponse> {
    return this.translationService.translate(translateDto);
  }

  @Post('translate-multiple')
  @ApiOperation({
    summary: 'Translate text to multiple languages',
    description:
      'Translates Uzbek text to Uzbek (Latin), Uzbek (Cyrillic), and Russian simultaneously.',
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
  @ApiOperation({
    summary: 'Convert Uzbek text between Latin and Cyrillic scripts',
    description:
      'Converts Uzbek text from Latin to Cyrillic script or vice versa without using external translation services.',
  })
  async convertScript(@Body() convertScriptDto: ConvertScriptDto) {
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
