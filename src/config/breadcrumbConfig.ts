export interface LevelOption {
    _id: string;
    name: string;
}

export interface BreadcrumbLevel {
    id: string;
    title: string;
}

export const BREADCRUMB_LEVELS: BreadcrumbLevel[] = [
    {
        id: "department",
        title: "Departamento",
    },
    {
        id: "province",
        title: "Provincia",
    },
    {
        id: "municipality",
        title: "Municipio",
    },
    {
        id: "electoralSeat",
        title: "Asiento Electoral",
    },
    {
        id: "electoralLocation",
        title: "Recinto Electoral",
    },
];
