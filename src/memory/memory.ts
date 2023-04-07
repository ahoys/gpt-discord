import { CreateChatCompletionRequest } from 'openai';
import { IMemoryObject } from '../types';

export const recallFromMemories = (): IMemoryObject[] => {
  return [];
};

export const processToMemories = (): void => {
  return;
};

export const getMemoryMessages =
  (): CreateChatCompletionRequest['messages'] => {
    const memories = recallFromMemories();
    return memories.map((memory) => ({
      role: memory.data.role,
      name: '',
      content: 'memory.data.content',
    }));
  };
