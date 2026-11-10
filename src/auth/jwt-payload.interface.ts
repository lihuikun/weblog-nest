export interface JwtPayload {
    userId: number;
    openId?: string;
    gameOpenId?: string;
    email?: string;
}
