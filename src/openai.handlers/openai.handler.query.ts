import config from '../config';
import data from '../../data';
import context from '../../context';
import computeCosineSimilarity from 'compute-cosine-similarity';
import { executeEmbedding } from '../openai.apis/api.embedding';
import { executeChatCompletion } from '../openai.apis/api.chatCompletion';
import { OpenAIApi } from 'openai';

export const openaiQueryHandler = async (
  openai: OpenAIApi,
  query: string,
  onSuccess: (content: string) => void,
  onFailure: (error: unknown) => void
) => {
  const embedding = await executeEmbedding(openai, query);
  if (Array.isArray(embedding) && Array.isArray(data)) {
    let smallest = 0;
    let similarity = 0;
    for (let i = 0; i < data.length; i++) {
      const value = computeCosineSimilarity(data[i], embedding);
      if (value > similarity && context[i] !== undefined) {
        smallest = i;
        similarity = value;
      }
    }
    let prompt = "Tell that you don't know the answer.";
    if (similarity >= 0.8) {
      prompt =
        'Use the context to answer the question. Context: ' + context[smallest];
    }
    const result = await executeChatCompletion(
      openai,
      {
        model: config.openai.defaultModel,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `Question: ${query}`,
          },
        ],
      },
      (response) => onSuccess(response),
      (err) => onFailure(err)
    );
    return result;
  }
};
