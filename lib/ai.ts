import Groq from 'groq-sdk'

const client = new Groq({apiKey: process.env.GROQ_API_KEY!}) 

export async function parseResume(resumeText: string) {

    const prompt = `Extract information from this resume and return ONLY a JSON object with no markdown, no backticks, no extra text - just raw JSON:
                ${resumeText}
                
                Return this exact structure: 
                {
                  "name": "full name",
                  "email": "email address",
                  "phone": "phone number or null",
                  "skills": ["skill1", "skill2"],
                  "experience": [
                    {
                      "company": "company name",
                       "role": "job title",
                       "years": "duration",
                       "bullets": ["achievement 1"]
                    }
                  ],
                  "education": [
                    {
                      "degree": "degree name",
                      "school": "school name",
                      "year": "graduation year"
                    }
                  ],
                  "summary: "brief professional summary"
                }`
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt}],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2
    })
    const text = completion.choices[0]?.message?.content || ''

    try {
        return JSON.parse(text)
    } catch (error) {
         const jsonMatch = text.match(/\{[\s\S]*\}/)
         if (jsonMatch){
            return JSON.parse(jsonMatch[0])
         }        
         throw new Error("Failed to parse AI response")
    }
}