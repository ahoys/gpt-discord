import { ChatCompletionRequestMessage } from 'openai';
import config from '../../config';
import { updateContextWithResponse, getContext } from '../utilities.memory';

let memory = {};

describe('updateContextWithResponse', () => {
  beforeEach(() => {
    // Reset the memory object before each test
    memory = {};
  });

  it('should update the memory object with a new response', () => {
    const id = '123';
    const author = 'user1';
    const content = 'Hello, world!';
    updateContextWithResponse(id, author, content, memory);
    const expectedMemory = {
      [id]: {
        [author]: [
          {
            role: 'system',
            content: 'Hello, world!',
          },
        ],
      },
    };
    expect(memory).toEqual(expectedMemory);
  });

  it('should append a new response to an existing author in the memory object', () => {
    const id = '123';
    const author = 'user1';
    const content1 = 'Hello, world!';
    const content2 = 'How are you?';
    updateContextWithResponse(id, author, content1, memory);
    updateContextWithResponse(id, author, content2, memory);
    const expectedMemory = {
      [id]: {
        [author]: [
          {
            role: 'system',
            content: 'Hello, world!',
          },
          {
            role: 'system',
            content: 'How are you?',
          },
        ],
      },
    };
    expect(memory).toEqual(expectedMemory);
  });

  it('should handle missing parameters', () => {
    updateContextWithResponse('', '', '', memory);
    expect(memory).toEqual({});
  });
});

describe('getContext', () => {
  const maxLength = 3;

  beforeEach(() => {
    // Reset the memory object before each test
    memory = {};
  });

  it('should return an array with a single user message', () => {
    const id = '123';
    const author = 'user1';
    const content = 'Hello, world!';
    const expectedMessages = [
      {
        role: 'system',
        content: config.openai.system,
      },
      {
        role: 'user',
        content,
      },
    ];
    const actualMessages = getContext(id, author, content, maxLength, memory);
    expect(actualMessages).toEqual(expectedMessages);
  });

  it('should limit the number of user messages to maxLength', () => {
    const id = '123';
    const author = 'user1';
    const content1 = 'Hello, world!';
    const content2 = 'How are you?';
    const content3 = 'I am fine, thanks!';
    const content4 = 'What about you?';
    const expectedMessages = [
      {
        role: 'system',
        content: config.openai.system,
      },
      {
        role: 'user',
        content: content1,
      },
      {
        role: 'user',
        content: content2,
      },
      {
        role: 'user',
        content: content3,
      },
      {
        role: 'user',
        content: content4,
      },
    ];
    getContext(id, author, content1, maxLength, memory);
    getContext(id, author, content2, maxLength, memory);
    getContext(id, author, content3, maxLength, memory);
    const actualMessages = getContext(id, author, content4, maxLength, memory);
    expect(actualMessages).toEqual(expectedMessages);
  });

  it('should handle missing parameters', () => {
    const id = '';
    const author = '';
    const content = '';
    const expectedMessages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: config.openai.system,
      },
    ];
    const actualMessages = getContext(id, author, content, maxLength, memory);
    expect(actualMessages).toEqual(expectedMessages);
  });
});
