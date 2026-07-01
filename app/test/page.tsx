"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function TestPage() {
  const [result, setResult] = useState("")
  const [jobId, setJobId] = useState("")
  const [appId, setAppId] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  async function handleLogin(role: string) {
    const email = role === "RECRUITER" ? "recruiter@gmail.com" : "candidate@gmail.com"
    const res = await signIn("credentials", {
      email,
      password: "password123",
      redirect: false
    })
    setResult(JSON.stringify(res, null, 2))
  }

  async function handleParseResume() {
    if (!resumeFile) {
      setResult("Please select a PDF file first")
      return
    }
    const formData = new FormData()
    formData.append("file", resumeFile)

    const res = await fetch("/api/resume/parse", {
      method: "POST",
      body: formData
    })
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  return (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Auth</h2>
      <button onClick={() => handleLogin("CANDIDATE")}>Login as Candidate</button>
      <button onClick={() => handleLogin("RECRUITER")}>Login as Recruiter</button>

      <h2>Resume Parse</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={e => setResumeFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleParseResume}>Upload + Parse Resume (login as candidate first)</button>

      <h2>Result</h2>
      <pre style={{ background: "#111", color: "#fff", padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </div>
  )
}