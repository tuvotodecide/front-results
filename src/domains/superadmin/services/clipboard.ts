export const copyTextToClipboard = async (value: string) => {
  await globalThis.navigator.clipboard?.writeText(value);
};
