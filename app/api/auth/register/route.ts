import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from 'bcryptjs'
import {z} from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "Name must beatleast 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be atleast 8 characters"),
    role: z.enum(["CANDIDATE", "RECRUITER"])
})

export async function POST(request: Request){
    try {
        const body = await request.json()

        const validation = registerSchema.safeParse(body)
        if (!validation.success){
            return NextResponse.json({
                success: false,
                errors: validation.error?.flatten().fieldErrors
            }, {status: 400})
        }

        const {name, email, password, role} = validation.data  

        const existingUser = await db.user.findUnique({ where: { email }})

        if (existingUser){
            return NextResponse.json({
                success: false,
                message: 'Already user exists with same email'
            }, {status: 409})
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            data: {
                name, 
                email, 
                passwordHash, 
                role
            },

            select: {
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                createdAt: true
            }
        })

        return NextResponse.json({
            success: true,
            message: "User account created successfully",
            user
        }, {status: 201})
    } catch (error) {
        console.log('Register Error: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})
    }
}