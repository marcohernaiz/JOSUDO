declare module 'passport-apple' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    passReqToCallback?: boolean;
    callbackURL: string;
  }
  
  export interface AppleProfile {
    id: string;
    displayName?: {
      firstName?: string;
      lastName?: string;
    };
    emails?: Array<{
      value: string;
      primary?: boolean;
    }>;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  }
  
  export class Strategy extends PassportStrategy {
    constructor(
      options: AppleStrategyOptions,
      verify: (
        req: any,
        accessToken: string,
        refreshToken: string,
        idToken: string,
        profile: AppleProfile,
        done: (error: any, user?: any) => void
      ) => void
    );
    
    authenticate(req: any, options?: any): void;
  }
} 