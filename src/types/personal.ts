export interface ParticipacionSummary {
    contratados: number;
    participaron: number;
    faltantes: number;
}

export interface ParticipacionDetail {
    _id: string;
    recinto: string;
    mesa: string;
    usuario: string;
    estado: string;
    ballotId: string | null;
}

export interface ParticipacionResponse {
    summary: ParticipacionSummary;
    details: ParticipacionDetail[];
}

export interface AuditoriaDetail {
    _id: string;
    recinto: string;
    mesa: string;
    testigo: string;
    auditoria: string;
    ballotId: string;
}

export interface AuditoriaResponse {
    observados: number;
    details: AuditoriaDetail[];
}

export interface PersonalFilters {
    electionId?: string;
    departmentId?: string;
    municipalityId?: string;
    [key: string]: any;
}
