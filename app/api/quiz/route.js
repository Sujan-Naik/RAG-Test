import OpenAI from "openai";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_KEY environment variable on the server." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const notes = Array.isArray(body?.notes) ? body.notes : [];

    if (notes.length === 0) {
      return new Response(JSON.stringify({ quiz: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const openai = new OpenAI({ apiKey });

    const context = notes.map(n => `${n.title ? `Title: ${n.title}\n` : ""}${n.text || ""}`).join("\n\n");

    const system = "You are a quiz generator. Create a 5-question multiple-choice quiz based on the provided notes. Each question should have 4 options (A, B, C, D) and specify the correct answer. Format as JSON array of objects with keys: question, options, correct.";
    const user = `Notes:\n${context}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    const responseText = completion.choices?.[0]?.message?.content?.trim() || "{}";
    let quiz;
    try {
      const parsed = JSON.parse(responseText);
      // Handle both {quiz: [...]} and direct array formats
      quiz = Array.isArray(parsed) ? parsed : (parsed.quiz || []);
    } catch (e) {
      console.error("Failed to parse quiz JSON:", e, "Response:", responseText);
      quiz = [];
    }

    return new Response(JSON.stringify({ quiz }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Quiz API error:", err);
    return new Response(JSON.stringify({ error: "Server error." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
