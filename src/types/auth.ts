export interface UserProfile {
    sub: string;
    email: string;
    role: string;
    active: boolean;
    votingDepartmentId?: string;
    votingMunicipalityId?: string;
    [key: string]: any;
}

export interface LoginResponse {
    accessToken: string;
    role: string;
    active: boolean;
    [key: string]: any;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password?: string;
    role?: string;
    departmentId?: string;
    municipalityId?: string;
    [key: string]: any;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password?: string;
}

export interface VerifyEmailResponse {
    message: string;
    [key: string]: any;
}
