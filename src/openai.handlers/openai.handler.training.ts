import fs from 'fs';
import path from 'path';
import material from '../../context';
import { executeEmbedding } from '../openai.apis/api.embedding';
import { OpenAIApi } from 'openai';

export const openaiTrainingHandler = async (openai: OpenAIApi) => {
  let str = material.join(' ');
  const embedding = await executeEmbedding(openai, str);
  const json = JSON.stringify(embedding);
  fs.writeFileSync(path.join(__dirname, 'embedding.json'), json);
};
