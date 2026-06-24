export const resultadosSummary = {
  results: [
    { partyId: "Partido Verde", totalVotes: 120 },
    { partyId: "Partido Azul", totalVotes: 80 },
  ],
  summary: {
    validVotes: 190,
    nullVotes: 5,
    blankVotes: 5,
  },
};

export const countedTables = [
  {
    _id: "table-1",
    tableCode: "LP-001-01",
    tableNumber: 1,
  },
];

export const auditSummary = {
  total: 3,
  observados: 1,
  sinObservaciones: 1,
  pendientes: 1,
  details: [
    {
      _id: "audit-1",
      recinto: "Unidad Educativa Central",
      mesa: "1",
      testigo: "Ana Auditora",
      auditoria: "No coincide",
      ballotId: "ballot-1",
    },
    {
      _id: "audit-2",
      recinto: "Colegio Norte",
      mesa: "2",
      testigo: "Luis Revisor",
      auditoria: "Pendiente",
      ballotId: null,
    },
  ],
};

export const mayorContract = {
  id: "contract-1",
  electionId: "election-2026",
  role: "MAYOR",
  territory: {
    type: "municipality",
    departmentId: "dep-lp",
    departmentName: "La Paz",
    municipalityId: "mun-lp",
    municipalityName: "La Paz",
  },
  active: true,
};

export const executiveSummary = {
  contract: {
    id: "contract-1",
    clientRole: "MAYOR",
    territory: {
      departmentName: "La Paz",
      municipalityName: "La Paz",
    },
  },
  summary: {
    totalDelegatesAuthorized: 3,
    activeDelegates: 2,
    participationRate: "66.67%",
    totalAttestations: 2,
    uniqueTablesAttested: 1,
    uniqueLocationsAttested: 1,
    avgAttestationsPerDelegate: "1.00",
  },
};

export const delegateTableActivity = {
  groupBy: "table",
  data: [
    {
      tableCode: "LP-001-01",
      tableNumber: "1",
      location: "Unidad Educativa Central",
      ballotId: "ballot-1",
      attestationDetails: [
        {
          dni: "1234567",
          delegateName: "Ana Delegada",
          ballotId: "ballot-1",
          support: 1,
          attestedAt: "2026-04-18T19:00:00.000Z",
        },
      ],
    },
  ],
};

export const delegateActivity = {
  groupBy: "delegate",
  data: [
    {
      dni: "1234567",
      name: "Ana Delegada",
      totalAttestations: 1,
    },
    {
      dni: "7654321",
      name: "Luis Sin Voto",
      totalAttestations: 0,
    },
  ],
};
