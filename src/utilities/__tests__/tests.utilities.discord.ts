import { splitString } from '../utilities.discord';

describe('splitString', () => {
  it('should split a string into chunks of "max" characters', () => {
    const str = 'Lorem ipsum dolor sit.';
    const expectedChunks = ['Lorem ipsum dolor si', 't.'];
    const actualChunks = splitString(str, 20);
    expect(actualChunks).toEqual(expectedChunks);
  });

  it('should handle empty strings', () => {
    const str = '';
    const expectedChunks: string[] = [];
    const actualChunks = splitString(str);
    expect(actualChunks).toEqual(expectedChunks);
  });

  it('should handle strings shorter than 2000 characters', () => {
    const str = 'Lorem ipsum dolor sit amet.';
    const expectedChunks = [str];
    const actualChunks = splitString(str);
    expect(actualChunks).toEqual(expectedChunks);
  });
});
