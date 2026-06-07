import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from '@/lib/auth'
import {z} from 'zod'


const createJobSchema = z.object({
    title: z.string().min(3, 'Title should be atleast 3 character long'),
    description: z.string().min(20, "Description should be atleast 20 character long"),
    requirements: z.array(z.string()).min(1, "At least one requirement needed"),
    skills: z.array(z.string()).min(1, "Atleast 1 skills needed"),
    location: z.string().min(2, 'Location is required'),
    type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional()
})

export async function POST(request: Request){
    try {
        const session = await auth()

        if(!session){
            return NextResponse.json({
                success: false,
                message: 'You are not logged In'
            }, {status: 401})
        }

        if (session.user.role !== 'RECRUITER'){
            return NextResponse.json({
                success: false, 
                message:'Only recruiter can post jobs'
            }, {status:403})
        }

        const body = await request.json()

        const validation = createJobSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                success: false, 
                errors: validation.error.flatten().fieldErrors
            }, {status: 400})
        }

        const { title, description, requirements, location, type, salaryMax, salaryMin, skills} = validation.data 

        const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-"+ Date.now()
        
        const job = await db.job.create({
            data:{
                recruiterId: session.user.id,
                title,
                slug, 
                description,
                requirements,
                skills,
                location,
                currency: 'INR',
                type,
                salaryMin,
                salaryMax,
                status: 'PUBLISHED'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Job Added Successfully!',
            job
        }, {status: 201})

    } catch (error) {
        console.log('Create Jobs error: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})
    }
} 

export async function GET(request: Request){
    try {
        const { searchParams } = new URL(request.url)

        const search = searchParams.get("search") || ""
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const type = searchParams.get("type") || undefined

        const skip = (page - 1) * limit 
        
        const where = {
            status: "PUBLISHED" as const, 
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const}},
                    { description: {contains: search, mode: 'insensitive' as const}}
                ]
            }),
            ...(type && {type: type as any})
        }

        const [jobs, total] = await Promise.all([
            db.job.findMany({
                where,
                skip, 
                take: limit, 
                orderBy: { createdAt: "desc"},
                include: {
                    recruiter: {
                        select: { name: true, email: true}
                    },
                    _count: {
                        select: { applications: true}
                    }
                }
            }),
            db.job.count({where})
        ])

        return NextResponse.json({
            success: true,
            jobs,
            total,
            pages: Math.ceil(total/limit),
            currentPage: page
        })

    } catch (error) {
        console.log('GET - jobs error: ', error)
        return NextResponse.json({
            success: false,
            message: "Something went wrong! Try again later"
        }, {status: 500})
    }
}