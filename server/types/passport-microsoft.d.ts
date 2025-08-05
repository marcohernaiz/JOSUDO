declare module 'passport-microsoft' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface MicrosoftStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: boolean;
  }
  
  export interface MicrosoftProfile {
    id: string;
    displayName?: string;
    name?: {
      familyName?: string;
      givenName?: string;
    };
    emails?: Array<{
      value: string;
      type?: string;
    }>;
    photos?: Array<{
      value: string;
    }>;
  }
  
  export class Strategy extends PassportStrategy {
    constructor(
      options: MicrosoftStrategyOptions,
      verify: (
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: MicrosoftProfile,
        done: (error: any, user?: any) => void
      ) => void
    );
    
    authenticate(req: any, options?: any): void;
  }
} 