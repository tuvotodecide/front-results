export interface LocationItem {
  name: string;
  value: string;
  parentId?: string;
}

export const departamentos: LocationItem[] = [
  { name: "Cochabamba", value: "cochabamba" },
  { name: "La Paz", value: "lapaz" },
  { name: "Santa Cruz", value: "santacruz" },
  { name: "Chuquisaca", value: "chuquisaca" },
  { name: "Oruro", value: "oruro" },
  { name: "Potosí", value: "potosi" },
  { name: "Tarija", value: "tarija" },
  { name: "Beni", value: "beni" },
  { name: "Pando", value: "pando" },
];

export const provincias: LocationItem[] = [
  // Cochabamba
  { name: "Cercado", value: "cercado", parentId: "cochabamba" },
  { name: "Chapare", value: "chapare", parentId: "cochabamba" },
  { name: "Ayopaya", value: "ayopaya", parentId: "cochabamba" },
  // La Paz
  { name: "Murillo", value: "murillo", parentId: "lapaz" },
  { name: "Omasuyos", value: "omasuyos", parentId: "lapaz" },
  // Santa Cruz
  { name: "Andrés Ibáñez", value: "andresibaniez", parentId: "santacruz" },
  { name: "Warnes", value: "warnes", parentId: "santacruz" },
];

export const municipios: LocationItem[] = [
  // Cercado - Cochabamba
  { name: "Cochabamba", value: "cochabamba", parentId: "cercado" },
  { name: "Colcapirhua", value: "colcapirhua", parentId: "cercado" },
  { name: "Quillacollo", value: "quillacollo", parentId: "cercado" },
  { name: "Sacaba", value: "sacaba", parentId: "cercado" },
  { name: "Tiquipaya", value: "tiquipaya", parentId: "cercado" },
  { name: "Vinto", value: "vinto", parentId: "cercado" },
  // Chapare - Cochabamba
  { name: "Chimoré", value: "chimore", parentId: "chapare" },
  { name: "Puerto Villarroel", value: "puertovillarroel", parentId: "chapare" },
  { name: "Entre Ríos", value: "entrerios", parentId: "chapare" },
  // Ayopaya - Cochabamba
  { name: "Ayopaya", value: "ayopaya", parentId: "ayopaya" },
  { name: "Morochata", value: "morochata", parentId: "ayopaya" },
  { name: "Cocapata", value: "cocapata", parentId: "ayopaya" },
  // Murillo - La Paz
  { name: "La Paz", value: "lapaz", parentId: "murillo" },
  { name: "El Alto", value: "elalto", parentId: "murillo" },
  { name: "Achocalla", value: "achocalla", parentId: "murillo" },
  { name: "Palca", value: "palca", parentId: "murillo" },
  // Omasuyos - La Paz
  { name: "Achacachi", value: "achacachi", parentId: "omasuyos" },
  { name: "Ancoraimes", value: "ancoraimes", parentId: "omasuyos" },
  { name: "Chua Cocani", value: "chuacocani", parentId: "omasuyos" },
  // Andrés Ibáñez - Santa Cruz
  {
    name: "Santa Cruz de la Sierra",
    value: "santacruzdelasierra",
    parentId: "andresibaniez",
  },
  { name: "La Guardia", value: "laguardia", parentId: "andresibaniez" },
  { name: "El Torno", value: "eltorno", parentId: "andresibaniez" },
  // Warnes - Santa Cruz
  { name: "Warnes", value: "warnes", parentId: "warnes" },
  { name: "Okinawa Uno", value: "okinawauno", parentId: "warnes" },
];
