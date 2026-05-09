import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { buildCaseGenerationPrompt } from './prompts/case-generation.prompt';
import { buildInterrogationPrompt } from './prompts/interrogation.prompt';
import { buildHintPrompt } from './prompts/hint.prompt';
import { buildVerdictRevealPrompt } from './prompts/verdict-reveal.prompt';

const MODEL = 'llama-3.3-70b-versatile';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq;

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async generateCase(difficulty: string): Promise<any> {
    const prompt = buildCaseGenerationPrompt(difficulty);

    this.logger.log(`Generating case with difficulty: ${difficulty}`);

    const completion = await this.groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);

    this.logger.log(`Case generated successfully with ${parsed.suspects?.length ?? 0} suspects`);

    return parsed;
  }

  async generateInterrogationResponse(
    suspect: any,
    history: any[],
    question: string,
  ): Promise<string> {
    const conversationHistory = history.map((turn) => [
      { role: 'detective', content: turn.question },
      { role: 'suspect', content: turn.answer },
    ]).flat();

    const prompt = buildInterrogationPrompt(suspect, conversationHistory, question);

    this.logger.log(`Generating interrogation response for suspect: ${suspect.name}`);

    const completion = await this.groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  async generateHint(caseData: any, history: any[]): Promise<string> {
    const prompt = buildHintPrompt(caseData, history);

    this.logger.log('Generating hint for detective');

    const completion = await this.groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  async generateVerdictReveal(
    caseData: any,
    accusedName: string,
    correct: boolean,
  ): Promise<string> {
    const prompt = buildVerdictRevealPrompt(caseData, accusedName, correct);

    this.logger.log(`Generating verdict reveal. Correct: ${correct}`);

    const completion = await this.groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }
}
