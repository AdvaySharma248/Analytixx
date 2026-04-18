export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isVerified: boolean;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: string;
      };
    }
  }
}
