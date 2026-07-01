import { parseResume } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { extractText, getDocumentProxy } from "unpdf"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({
        success: false,
        message: "You are not logged in"
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "Resume is required"
      }, { status: 400 })
    }

    // ✅ read the file ONCE into bytes
    const bytes = await file.arrayBuffer()

    // ✅ create TWO separate buffers from the same bytes
    // buffer → for PDF text extraction (unpdf consumes this)
    // uploadBuffer → for Supabase upload (separate copy)
    const buffer = new Uint8Array(bytes)
    const uploadBuffer = Buffer.from(bytes.slice(0))

    // step 1 — extract text from PDF
    const pdfData = await getDocumentProxy(buffer)
    const { text } = await extractText(pdfData, { mergePages: true })

    // step 2 — send text to AI, get structured JSON back
    const getResumeRes = await parseResume(text)

    // step 3 — upload ORIGINAL PDF to Supabase using uploadBuffer
    const filename = `${Date.now()}-${session.user.id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filename, uploadBuffer, {
        contentType: "application/pdf",
        upsert: false
      })

    if (uploadError) {
      throw new Error("file upload failed: " + uploadError.message)
    }

    // step 4 — get the public URL of the uploaded PDF
    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(filename)

    const fileUrl = urlData.publicUrl

    // step 5 — save to database
    const resume = await db.resume.create({
      data: {
        candidateId: session.user.id,
        fileUrl,
        parsedData: getResumeRes,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Resume parsed successfully",
      resume
    }, { status: 201 })

  } catch (error) {
    console.error("Resume Parse POST error:", error)
    return NextResponse.json({
      success: false,
      message: "Something went wrong! Try again later"
    }, { status: 500 })
  }
}