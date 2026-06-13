import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import {z} from "zod"

const updateStatusSchema = z.object({
  status: z.enum(["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
  note: z.string().optional()
})

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({
                success: false,
                message: 'You are not logged In'
            }, {status: 401})
        }

        if(session.user.role !== 'RECRUITER'){
            return NextResponse.json({
                success: false,
                message: 'Only recruiter can edit the application status'
            }, {status: 403})
        }
        
        const {id} = await params 

        const body = await request.json()
        const validation = updateStatusSchema.safeParse(body)

        if (!validation.success){
            return NextResponse.json({
                success: false,
                errors: validation.error.flatten().fieldErrors
            }, {status: 400})
        }

        const {status, note } = validation.data

        const application = await db.application.findUnique({
            where: { id }
        })

        if(!application){
            return NextResponse.json({
                success: false,
                message: 'Application not found'
            }, {status: 404})
        }

        const updateApplication = await db.application.update({
            where: { id },
            data: {status}
        })

        await db.notification.create({
            data: {
                userId: application.candidateId,
                type: "STATUS_UPDATED",
                message: `Your application status has been updated from ${application.status} to ${status}`,
                link: '/dashboard'
            }
        })

        return NextResponse.json({
            success: true, 
            message: 'Application status has been updated',
            updateApplication
        }, {status: 200})

    } catch (error) {
        console.log('Error at PATCH - application/[id]/status: ', error)
        return NextResponse.json({
            success: false, 
            message: 'Something went wrong! Try again later'
        }, {status: 500})
    }
}