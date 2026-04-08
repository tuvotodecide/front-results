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
