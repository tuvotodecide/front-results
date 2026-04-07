export const partyColors = {
  unidad: '#f8ba51',
  libre: '#f4271c',
  'apb sumate': '#521b66',
  pdc: '#1c6066',
  ap: '#3c6b39',
  fp: '#3fa6ea',
  'mas-ipsp': '#2245a9',
  adn: '#cf2821',
};

/**
 * Get the color for a given party ID
 * @param partyId - The party ID string to look up
 * @returns The color string if found, null if no match
 */
export const getPartyColor = (partyId: string): string | null => {
  // Process the partyId: trim whitespace and convert to lowercase
  const processedPartyId = partyId.trim().toLowerCase();

  // Look up the color in the partyColors object
  return partyColors[processedPartyId as keyof typeof partyColors] || null;
};
