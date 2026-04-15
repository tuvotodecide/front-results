export const partyColors = {
  unidad: "#f8ba51",
  libre: "#f4271c",
  "apb sumate": "#521b66",
  pdc: "#1c6066",
  ap: "#3c6b39",
  fp: "#3fa6ea",
  "mas-ipsp": "#2245a9",
  adn: "#cf2821",
};

export const getPartyColor = (partyId: string): string | null => {
  const processedPartyId = partyId.trim().toLowerCase();

  return partyColors[processedPartyId as keyof typeof partyColors] || null;
};

export const getDeterministicPartyColor = (partyId: string): string => {
  const knownColor = getPartyColor(partyId);
  if (knownColor) return knownColor;

  let hash = 0;
  const normalized = partyId.trim().toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) & 0xffffff;
  }

  return `#${hash.toString(16).padStart(6, '0')}`;
};
