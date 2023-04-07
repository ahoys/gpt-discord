// import computeCosineSimilarity from 'compute-cosine-similarity';
// import { OpenAIApi } from 'openai';
// import { executeEmbedding } from '../openai.apis/api.createEmbedding';

// /**
//  * Get context.
//  * @param openai OponAI API.
//  * @param context Vectorized context.
//  * @param query Query as a string or vector.
//  * @returns System message with the context.
//  */
// export const getContext = async (
//   openai: OpenAIApi,
//   embeddings: {
//     name: string;
//     content: string;
//     vector: number[];
//   }[],
//   query: string | number[]
// ): Promise<string> => {
//   let queryVector: string | number[] = query;
//   if (typeof query === 'string') {
//     queryVector = (await executeEmbedding(openai, query)) || [];
//   }
//   if (Array.isArray(queryVector)) {
//     let smallest = -1;
//     let similarity = 0;
//     for (let i = 0; i < embeddings.length; i++) {
//       const value = computeCosineSimilarity(embeddings[i].vector, queryVector);
//       if (value > similarity && value > 0.8) {
//         smallest = i;
//         similarity = value;
//       }
//     }
//     if (smallest >= 0 && typeof embeddings[smallest]?.content === 'string') {
//       return `Answer to Question with Context: ${embeddings[smallest]?.content}`;
//     }
//   }
//   return 'Answer that you do not know the answer.';
// };
