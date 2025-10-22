import { ProcessingStepType } from '@prisma/client';

interface data {
  url?: string;
  agentId?: string;
  sourceId?: string;
  sourceWebsiteId?: string;
}
export interface StepQueuePayload {
  userId: string;
  data?: data | any;
  metadata?: Record<string, any>;
  stepType?: ProcessingStepType;
}

export interface StepExecutionContext {
  stepId: string;
  stepType: ProcessingStepType;
  payload: StepQueuePayload;
  currentStepNumber: number;
  totalSteps: number;
}

export interface StepHandler {
  execute(context: StepExecutionContext): Promise<any>;
}

// types/ai.types.ts

export interface TenderAiParsingData {
  items: {
    id: string;
    unit: string;
    notes: string;
    deadline: string;
    quantity: number;
    item_name: string;
    extra_helping_info: string;
  }[];
  company_name: string;
  tender_title: string;
}

export interface ProposalAiParsingData {
  deadline: {
    unit: string;
    value: number;
  };
  delivery: string;
  products: {
    proposalItemId: string;
    unit: string;
    notes: string;
    quantity: number;
    item_name: string;
    price_full: number;
    price_without_vat: number;
    vat_amount: number;
  }[];
}

export interface AiValidationData {
  matches: {
    match: string;
    item_id: string;
    reasoning: string;
    proposalItemId: string;
    tender_item_name: string;
    matched_proposed_product_name: string;
  }[];
}
