import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: {label: 'Email', type: 'email'},
                password: {label: 'Password', type: 'password'}
            },
            async authorize(credentials){
                if (!credentials?.email || !credentials?.password) return null

                const user = await db.user.findUnique({
                    where: {email: credentials.email}
                })

                if (!user || !user.passwordHash) return null

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!passwordMatch) return null 

                return user
            }
        })
    ],

    callbacks: {
        async jwt({ token, user}) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }

            return token 
        }, 
        async session({session, token}) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }

            return session
        }
    },

    pages: {
        signIn: "/login"
    },

    session: {
        strategy: "jwt"
    },

    secret: process.env.NEXTAUTH_SECRET
})