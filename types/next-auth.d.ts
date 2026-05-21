import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      userType?: string;
      restaurantId?: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    userType?: string;
    restaurantId?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userType?: string;
    restaurantId?: string;
    role?: string;
  }
}
