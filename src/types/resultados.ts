export interface PartyResult {
    partyId: string;
    totalVotes: number;
}

export interface ResultsSummary {
    validVotes: number;
    nullVotes: number;
    blankVotes: number;
    tablesProcessed: number;
    totalTables: number;
    totalVoters?: number;
    registrationProgress?: number;
}

export interface ResultsResponse {
    results: PartyResult[];
    summary: ResultsSummary;
}

export interface RegistrationProgress {
    totalTables: number;
    processedTables: number;
    percentage: number;
}

export interface StatisticsResponse {
    totalVotes: number;
    lastUpdate: string;
    [key: string]: any;
}
