import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { error } from "console"
import { NextResponse } from "next/server"
import { success, z } from "zod"

const updateJobSchema = z.object({
    title: z.string().min(3, 'Title should be atleast 3 character long'),
    description: z.string().min(20, "Description should be atleast 20 character long"),
    requirements: z.array(z.string()).min(1, "At least one requirement needed"),
    skills: z.array(z.string()).min(1, "Atleast 1 skills needed"),
    location: z.string().min(2, 'Location is required'),
    type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional()
})

export async function GET(request: Request, { params } : {params: {id : string}}){
    try {
        const id = params.id

        const data = await db.job.findUnique({
            where: {id}
        })

        if (!data) {
            return NextResponse.json({
                success: false,
                message: 'No job post'
            }, {status: 404})
        }

        return NextResponse.json({
            success: true,
            message: 'Successfull',
            data
        })
    } catch (error) {
        console.log('Get Job by id: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})        
    }
}

export async function PATCH(request: Request, { params }: {params: {id: string}}){
    try {
        const session = await auth()

        if(!session) {
            return NextResponse.json({
                success: false, 
                message: 'You are not logged in'
            }, {status: 400})
        }

        const id = params.id 
        
        const body = await request.json()

        const validation = updateJobSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                errors: validation.error.flatten().fieldErrors
            }, {status: 400})
        }

        const exist_job = await db.job.findUnique({
            where: { id }
        })

        if (!exist_job){
            return NextResponse.json({
                success: false,
                message: 'Job not found'
            }, {status: 404})
        }

        if (exist_job.recruiterId !== session.user.id){
            return NextResponse.json({
                success: false, 
                message: 'You can only edit your own job'
            }, {status: 403})
        }

        const updatedJob = await db.job.update({
            where: { id },
            data: validation.data
        })

        return NextResponse.json({
            success: false,
            message: 'Job updated successfully',
            job: updatedJob
        }, {status: 200})

    } catch (error) {
        console.log('Patch jobs error: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})
    }
}

export async function DELETE(request: Request, { params }: {params: {id: string}}) {
    try {
        const id = params.id 

        const session = await auth()

        if(!session) {
            return NextResponse.json({
                success: false, 
                message: 'You are not logged In'
            }, {status: 401})
        }

        const job = await db.job.findUnique({
            where: { id }
        })

        if (!job) {
            return NextResponse.json({
                success: false,
                message: 'Job not found'
            }, {status: 404})
        }

        if (job.recruiterId !== session.user.id){
            return NextResponse.json({
                success: false,
                message: 'You can only delete the job post that is created by you'
            }, {status: 403})
        }

        const updatedJob = await db.job.update({
            where: {id},
            data: { status: 'CLOSED'}
        })

        return NextResponse.json({
            success: true,
            message: 'Job deleted successfully',
            job: updatedJob
        }, {status: 200})
    } catch (error) {
        console.log('Delete jobs error: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})
    }
}
