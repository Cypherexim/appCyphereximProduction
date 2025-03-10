export interface LoginResponse {
    message: string;
    error: Boolean
    code: string;
    model?: UserModel
}

export interface UserModel {
    UserId?: string;
    Email?: string;
    Password?: string;
    FullName?: string;
    CompanyName?: string;
    MobileNumber?: string;
}

export class Login {
    Email: string;
    Password: string;
}