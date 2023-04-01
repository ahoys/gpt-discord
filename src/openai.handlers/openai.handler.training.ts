import fs from 'fs';
import path from 'path';
import material from '../../context';
import { executeEmbedding } from '../openai.apis/api.embedding';
import { OpenAIApi } from 'openai';

export const openaiTrainingHandler = async (openai: OpenAIApi) => {
  const result: number[][] = [];
  for (let i = 0; i < material.length; i++) {
    const str = material[i];
    await executeEmbedding(openai, str).then((res) => {
      if (Array.isArray(res)) {
        console.log('Success ', i);
        result.push(res);
      } else {
        result.push([]);
      }
    });
  }
  const json = JSON.stringify(result);
  fs.writeFileSync(path.join(__dirname, 'embedding.json'), json);
};
