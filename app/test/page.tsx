"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function TestPage() {
    const [result, setResult] = useState("")

      async function handleCreateJob() {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Senior React Developer",
            description: "We are looking for an experienced React developer to join our team and build amazing products",
            requirements: ["3+ years React experience", "TypeScript knowledge"],
            skills: ["React", "TypeScript", "Next.js"],
            location: "Remote",
            type: "FULL_TIME",
            salaryMin: 80000,
            salaryMax: 120000
          })
        })
        const data = await res.json()
        setResult(JSON.stringify(data, null, 2))
      }
    // async function handleLogin() {
    //     const res = await signIn("credentials", {
    //         email: "recruiter@gmail.com",
    //         password: "password123",
    //         redirect: false
    //     })
    //     setResult(JSON.stringify(res, null, 2))
    // }

    return (
        <div style={{ padding: 40 }}>
            <button onClick={handleCreateJob}>Create Job</button>
            <pre>{result}</pre>
        </div>
    )
}