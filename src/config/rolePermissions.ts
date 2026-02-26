export type UserRole = "SUPERADMIN" | "MAYOR" | "GOVERNOR" | "publico" | "PUBLIC";

export interface RoleConfig {
    homePath: (user: any) => string;
    allowedPaths: string[];
}

export const ROLE_PERMISSIONS: Record<string, RoleConfig> = {
    SUPERADMIN: {
        homePath: () => "/panel",
        allowedPaths: ["*"], // Superadmin can access everything
    },
    MAYOR: {
        homePath: (user) =>
            user.municipalityId
                ? `/resultados?department=${user.departmentId}&municipality=${user.municipalityId}`
                : "/resultados",
        allowedPaths: ["/resultados", "/control-personal", "/auditoria-tse", "/perfil"],
    },
    GOVERNOR: {
        homePath: (user) =>
            user.departmentId
                ? `/resultados?department=${user.departmentId}`
                : "/resultados",
        allowedPaths: ["/resultados", "/control-personal", "/auditoria-tse", "/perfil"],
    },
    publico: {
        homePath: () => "/",
        allowedPaths: ["/resultados", "/perfil"],
    },
    PUBLIC: {
        homePath: () => "/",
        allowedPaths: ["/resultados", "/perfil"],
    },
};

export const getRoleConfig = (role: string): RoleConfig => {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["publico"];
};
