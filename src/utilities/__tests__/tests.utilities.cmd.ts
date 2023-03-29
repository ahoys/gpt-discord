import { getId } from '../utilities.cmd';

describe('getId', () => {
  it('should return the correct ID', () => {
    const guild = 'myGuild';
    const channel = 'myChannel';
    const expectedId = `${guild}-${channel}`;
    const actualId = getId(guild, channel);
    expect(actualId).toEqual(expectedId);
  });

  it('should handle empty strings', () => {
    const guild = '';
    const channel = '';
    const expectedId = '-';
    const actualId = getId(guild, channel);
    expect(actualId).toEqual(expectedId);
  });
});
