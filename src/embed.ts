import fs from 'fs';
import config from './config';
import axios from 'axios';
import { print } from 'logscribe';
// import { encoding_for_model } from '@dqbd/tiktoken';

type TJsonTypeOptions = string | number | boolean | IJsonData;

interface IJsonData {
  [key: string]: TJsonTypeOptions | TJsonTypeOptions[];
}

const model = 'text-embedding-ada-002';

/**
 * Processes an array of JSON data.
 * @returns A string of the processed array.
 */
const processArray = (array: TJsonTypeOptions[]) => {
  let input = '';
  for (const value of array) {
    if (typeof value === 'string') {
      input += value + ' ';
    } else if (typeof value === 'number') {
      input += value + ' ';
    } else if (typeof value === 'boolean') {
      input += value + ' ';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        input += processArray(value);
      } else {
        input += translateJson(value);
      }
    }
  }
  return input;
};

/**
 * Translates a JSON object into a string.
 * @returns A string of the processed JSON object.
 */
const translateJson = (jsonData: IJsonData) => {
  let input = '';
  for (const key of Object.keys(jsonData)) {
    const value = jsonData[key];
    input += key + ': ';
    if (Array.isArray(value)) {
      input += processArray(value as TJsonTypeOptions[]);
    } else if (typeof value === 'object') {
      input += translateJson(value as IJsonData);
    } else if (typeof value === 'string') {
      input += value.replace(/:/gm, '') + ' ';
    } else if (typeof value === 'number') {
      input += value + ' ';
    } else if (typeof value === 'boolean') {
      input += value + ' ';
    }
    input += ' ';
  }
  return input.replace(/(\r\n|\n|\r)/gm, ' ').trim();
};

/**
 * Will translate a JSON file into trained data.
 * @returns A promise that resolves when the embedding is complete.
 */
const embed = () => {
  if (config.openai.embeddingInput) {
    print('Embedding ' + config.openai.embeddingInput + ' requested.');
    const embedding = fs.readFileSync(config.openai.embeddingInput, 'utf8');
    if (embedding) {
      print('Embedding data found.');
      const jsonData = JSON.parse(embedding);
      const input = translateJson(jsonData);
      // const enc = encoding_for_model(model);
      // const tokens = enc.encode(input).length;
      // enc.free();
      if (123 <= config.openai.embeddingMaxTokens) {
        axios
          .post(
            'https://api.openai.com/v1/embeddings',
            {
              model,
              input,
            },
            {
              headers: {
                Authorization: 'Bearer ' + config.openai.apiKey,
              },
            }
          )
          .then((res) => {
            if (res?.data) {
              fs.writeFileSync(
                config.openai.embeddingOutput,
                JSON.stringify(res.data)
              );
              print('Embedding saved to ' + config.openai.embeddingOutput);
            } else {
              print('Failed to receive valid embedding data.');
            }
          })
          .catch((err) => {
            print(err);
          });
      } else {
        print(
          'Embedding data is too large. ' +
            123 +
            ' tokens found, ' +
            config.openai.embeddingMaxTokens +
            ' tokens allowed.'
        );
      }
    } else {
      print('Embedding data not found.');
    }
  }
};

embed();
