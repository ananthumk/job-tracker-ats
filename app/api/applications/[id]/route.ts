import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> } ){
     try {
        const session = await auth()

        if (!session){
            return NextResponse.json({
                success: false,
                message: 'You are not logged In'
            }, {status: 401})
        }
        

        const {id} = await params

        const application = await db.application.findUnique({
            where: { id }
        })

        if (!application) {
            return NextResponse.json({
                success: false, 
                message: 'Application not found'
            }, {status: 404})
        }

        if(application.candidateId !== session.user.id && session.user.role === 'CANDIDATE'){
              return NextResponse.json({
                success: false, 
                message: 'Not authorized'
              }, {status: 403})
        }

        return NextResponse.json({
            success: true, 
            application
        }, {status: 200})


     } catch (error) {
        console.log('Error at Get - application[id]: ', error)
        return NextResponse.json({
            success: false,
            message: 'Something went wrong! Try again later'
        }, {status: 500})
     }
}