"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function TestPage() {
  const [result, setResult] = useState("")
  const [jobId, setJobId] = useState("")
  const [appId, setAppId] = useState("")

  async function handleLogin(role: string) {
    const email = role === "RECRUITER" ? "recruiter@gmail.com" : "candidate@gmail.com"
    const res = await signIn("credentials", {
      email,
      password: "password123",
      redirect: false
    })
    setResult(JSON.stringify(res, null, 2))
  }

  async function handleCheckSession() {
    const res = await fetch("/api/auth/session")
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleGetJobs() {
    const res = await fetch("/api/jobs")
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleApply() {
    const formData = new FormData()
    formData.append("jobId", jobId)
    formData.append("coverLetter", "I am very interested in this role")
    const fakeFile = new File(["fake pdf content"], "resume.pdf", { type: "application/pdf" })
    formData.append("resumeFile", fakeFile)
    const res = await fetch("/api/applications", {
      method: "POST",
      body: formData
    })
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleGetApplications() {
    const res = await fetch("/api/applications")
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleGetApplicationsRecruiter() {
    const res = await fetch(`/api/applications?jobId=${jobId}`)
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleGetSingleApplication() {
    const res = await fetch(`/api/applications/${appId}`)
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  async function handleUpdateStatus() {
    const res = await fetch(`/api/applications/${appId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SCREENED" })
    })
    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
  }

  return (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Auth</h2>
      <button onClick={() => handleLogin("CANDIDATE")}>Login as Candidate</button>
      <button onClick={() => handleLogin("RECRUITER")}>Login as Recruiter</button>
      <button onClick={handleCheckSession}>Check Session</button>

      <h2>Jobs</h2>
      <button onClick={handleGetJobs}>GET /api/jobs</button>

      <h2>Applications</h2>
      <input
        placeholder="paste job id here"
        value={jobId}
        onChange={e => setJobId(e.target.value)}
        style={{ padding: 8, width: 400 }}
      />
      <button onClick={handleApply}>POST /api/applications — apply (login as candidate first)</button>
      <button onClick={handleGetApplications}>GET /api/applications — candidate sees own</button>
      <button onClick={handleGetApplicationsRecruiter}>GET /api/applications?jobId — recruiter sees by job (login as recruiter first)</button>

      <input
        placeholder="paste application id here"
        value={appId}
        onChange={e => setAppId(e.target.value)}
        style={{ padding: 8, width: 400 }}
      />
      <button onClick={handleGetSingleApplication}>GET /api/applications/[id] — single application</button>
      <button onClick={handleUpdateStatus}>PATCH status → SCREENED (login as recruiter first)</button>

      <h2>Result</h2>
      <pre style={{ background: "#111", color: "#fff", padding: 16, borderRadius: 8, fontSize: 12 }}>
        {result}
      </pre>
    </div>
  )
}