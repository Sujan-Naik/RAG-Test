import OpenAI from "openai";

function cosineSim(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-12);
}

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_KEY environment variable on the server." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const notes = Array.isArray(body?.notes) ? body.notes : [];
    const question = (body?.question || "").toString().trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const openai = new OpenAI({ apiKey });

    if (notes.length === 0) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant. The user did not provide any notes. If you don't have enough information, say so." },
          { role: "user", content: question }
        ],
        temperature: 0.2
      });
      const answer = completion.choices?.[0]?.message?.content?.trim() || "I couldn't generate an answer.";
      return new Response(JSON.stringify({ answer, sources: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const inputs = [question, ...notes.map(n => `${n.title ? `Title: ${n.title}\n` : ""}${n.text || ""}`)];

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: inputs
    });

    const vectors = emb.data.map(d => d.embedding);
    const qVec = vectors[0];
    const noteVecs = vectors.slice(1);

    const ranked = noteVecs.map((vec, i) => {
      const sim = cosineSim(qVec, vec);
      const note = notes[i];
      return { id: note.id, title: note.title, text: note.text, similarity: sim };
    }).sort((a, b) => b.similarity - a.similarity);

    const topK = ranked.slice(0, Math.min(3, ranked.length));

    const context = topK.map((n, idx) => `Source ${idx + 1} - ${n.title || "Untitled"}\n${n.text}`).join("\n\n");

    const system = "You are a concise and accurate assistant. Answer ONLY using the provided note excerpts. If the notes do not contain the answer, respond: \"I couldn't find that in your notes.\" Include no fabricated details.";
    const user = `Here are relevant note excerpts:\n\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.1
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "I couldn't find that in your notes.";
    return new Response(JSON.stringify({ answer, sources: topK }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("RAG API error:", err);
    return new Response(JSON.stringify({ error: "Server error." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
