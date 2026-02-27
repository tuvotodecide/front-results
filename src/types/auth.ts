export interface UserProfile {
    sub: string;
    id?: string;
    _id?: string;
    email: string;
    role: string;
    active: boolean;
    isApproved?: boolean;
    name?: string;
    fullName?: string;
    votingDepartmentId?: string;
    votingMunicipalityId?: string;
    departmentId?: string;
    municipalityId?: string;
    status?: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
}

export interface LoginResponse {
    accessToken: string;
    access_token?: string; // Compatibilidad con snake_case
    token?: string;
    role: string;
    active: boolean;
    isApproved?: boolean;
    user?: UserProfile;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password?: string;
    role?: string;
    departmentId?: string;
    municipalityId?: string;
}

export interface RegisterResponse {
    message: string;
    user: UserProfile;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordRequest {
    token: string;
    password?: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface VerifyEmailResponse {
    message: string;
}
