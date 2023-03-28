/**
 * Returns a unique ID for a guild-channel combination.
 * @param guild Id of Guild.
 * @param channel Id of Channel.
 * @returns A unique ID for a guild-channel combination.
 */
export const getId = (guild: string, channel: string) => `${guild}-${channel}`;
