import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { superAdmins, staff } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }, // 'super_admin' or 'staff'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const userType = (credentials.userType as string) || 'staff';

        try {
          if (userType === 'super_admin') {
            // Check super admin
            const [admin] = await db
              .select()
              .from(superAdmins)
              .where(eq(superAdmins.email, email))
              .limit(1);

            if (!admin || !admin.isActive) {
              return null;
            }

            const isValid = await verifyPassword(password, admin.passwordHash);
            if (!isValid) {
              return null;
            }

            // Update last login
            await db
              .update(superAdmins)
              .set({ lastLoginAt: new Date() })
              .where(eq(superAdmins.id, admin.id));

            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              userType: 'super_admin',
            };
          } else {
            // Check restaurant staff (legacy password auth - new restaurants use access codes)
            const [staffMember] = await db
              .select()
              .from(staff)
              .where(eq(staff.email, email))
              .limit(1);

            if (!staffMember || !staffMember.isActive) {
              return null;
            }

            // If no password hash, this staff uses access code authentication
            if (!staffMember.passwordHash) {
              return null; // Access code auth happens via separate API
            }

            const isValid = await verifyPassword(password, staffMember.passwordHash);
            if (!isValid) {
              return null;
            }

            // Update last login
            await db
              .update(staff)
              .set({ lastLoginAt: new Date() })
              .where(eq(staff.id, staffMember.id));

            return {
              id: staffMember.id,
              email: staffMember.email || '',
              name: staffMember.name,
              userType: 'staff',
              restaurantId: staffMember.restaurantId,
              role: staffMember.role,
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.restaurantId = user.restaurantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userType = token.userType as string;
        session.user.restaurantId = token.restaurantId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
});
