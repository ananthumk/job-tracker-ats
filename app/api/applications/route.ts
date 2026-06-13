import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { success } from "zod"



export async function POST(request: Request){
    try {
       const session = await auth()

       if (!session) {
        return NextResponse.json({
            success: false,
            message: 'You are not logged In'
        }, {status: 401})
       }

       if (session.user.role !== 'CANDIDATE'){
        return NextResponse.json({
            success: false,
            message: 'Only candidate can apply for jobs'
        }, {status: 403})
       }

        const formData = await request.formData() 
        const jobId = formData.get('jobId') as string 
        const coverLetter = formData.get('coverLetter') as string 
        const file = formData.get("resumeFile") as File 

        if (!jobId || !file){
            return NextResponse.json({
                success: false, 
                message: 'Job Id and resume is required'
            }, {status: 400})
        }

        const job = await db.job.findUnique({
            where: { id: jobId}
        })

        if (!job) {
            return NextResponse.json({
                success: false,
                message: 'Job not found'
            }, {status: 404})
        }

        const existingApplication = await db.application.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId: session.user.id,
                    jobId
                }
            }
        })

        if (existingApplication){
            return NextResponse.json({
                success: false,
                message: 'You have already applied for this job'
            }, {status: 409})
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileName = `${Date.now()}-${session.user.id}.pdf`

        const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, buffer, {
            contentType: 'application/pdf',
            upsert: true
        })

        if (uploadError) {
            throw new Error("File upload failed: " + uploadError.message)
        }

        const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

        const resumeUrl = urlData.publicUrl 

        const application = await db.application.create({
            data: {
                candidateId: session.user.id,
                jobId,
                resumeUrl,
                coverLetter,
                status: "APPLIED"
            }
        })
        
        return NextResponse.json({
            success: true,
            message: "Application Submitted Successfully",
            application
        }, {status: 201})
       
    } catch (error) {
        console.log('Error at POST applications: ', error)
        return NextResponse.json({
            success: false, 
            message: 'Something went wrong1 Try again later'
        }, {status: 500})
    }
}

export async function GET(request: Request){
    try {
        const session = await auth()

       if (!session) {
        return NextResponse.json({
            success: false,
            message: 'You are not logged In'
        }, {status: 401})
       }

       if (session.user.role === 'CANDIDATE'){
          const applications = await db.application.findMany({
            where: {candidateId: session.user.id},
            include: {
                job: {
                    select: {title: true, location: true, type: true}
                }
            },
            orderBy: {
                appliedAt: 'desc'
            }
          })

          return NextResponse.json({
            success: true, 
            applications
          }, {status: 200})
       }

       if (session.user.role === 'RECRUITER'){
        const { searchParams } = new URL (request.url)
        const jobId = searchParams.get('jobId')

        if(!jobId){
            return NextResponse.json({
                success: false, 
                message: 'Job Id is required for recruiter'
            }, {status: 400})
        }
        
        const job = await db.job.findUnique({
            where: { id: jobId}
        })

        if (!job || job.recruiterId === session.user.id){
            return NextResponse.json({
                success: false, 
                message: 'Job not found or not yourd'
            }, {status: 404})
        }

        const applications = await db.application.findMany({
            where: { jobId }, 
            include: {
                candidate: {
                    select: { name: true, email: true}
                },
                orderBy: { appliedAt: 'desc'}
            }
        })

        return NextResponse.json({
            success: true, 
            applications
        }, {status: 200})

       }

    } catch (error) {
        console.log('Error at GET - application: ', error)
        return NextResponse.json({
            success: false, 
            message: "Something went wrong! Try again later"
        }, {status: 500})
    }
}