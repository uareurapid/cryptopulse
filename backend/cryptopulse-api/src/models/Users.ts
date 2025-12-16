export interface User {
    user_id: string,
    email: string,
    password: string
}

export interface UserResponse {
    user?: User
}