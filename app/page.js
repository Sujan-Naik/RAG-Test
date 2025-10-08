"use client";
import { useState } from "react";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addNote(e) {
    e.preventDefault();
    if (!text.trim() && !title.trim()) return;
    const id = Date.now().toString();
    setNotes(prev => [{ id, title: title.trim(), text: text.trim() }, ...prev]);
    setTitle("");
    setText("");
  }

  function removeNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function ask(e) {
    e.preventDefault();
    setError("");
    setAnswer(null);
    setSources([]);
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, notes })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>RAG Notes</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Take notes locally in your browser and ask questions powered by retrieval augmented generation. No storage or signup. Keep your OpenAI API key on the server via environment variable OPENAI_KEY.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 28 }}>
        <form onSubmit={addNote} style={{ background: "#111733", border: "1px solid #2a3565", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Note title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a3565", background: "#0f1530", color: "#eaeefb" }}
            />
            <textarea
              placeholder="Write your note..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a3565", background: "#0f1530", color: "#eaeefb", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
              <small style={{ opacity: 0.7 }}>Notes are kept in memory only and are sent to the server for retrieval when you ask a question.</small>
              <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, background: "#4e7dff", color: "#fff", border: "none", fontWeight: 600 }}>
                Add note
              </button>
            </div>
          </div>
        </form>

        {notes.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ fontSize: 18, margin: "6px 0" }}>Your notes</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {notes.map(n => (
                <li key={n.id} style={{ border: "1px solid #2a3565", background: "#0f1530", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{n.title || "Untitled"}</div>
                    </div>
                    <button onClick={() => removeNote(n.id)} style={{ border: "1px solid #2a3565", background: "transparent", color: "#9fb3ff", borderRadius: 8, padding: "6px 10px" }}>
                      Delete
                    </button>
                  </div>
                  {n.text && <p style={{ opacity: 0.85, whiteSpace: "pre-wrap", marginTop: 8 }}>{n.text}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section style={{ background: "#111733", border: "1px solid #2a3565", borderRadius: 10, padding: 16 }}>
        <form onSubmit={ask} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Ask a question about your notes..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a3565", background: "#0f1530", color: "#eaeefb" }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={loading} type="submit" style={{ padding: "10px 14px", borderRadius: 8, background: loading ? "#394a94" : "#4e7dff", color: "#fff", border: "none", fontWeight: 600 }}>
              {loading ? "Thinking..." : "Ask"}
            </button>
            <button type="button" onClick={() => { setAnswer(null); setSources([]); setQuestion(""); }} style={{ padding: "10px 14px", borderRadius: 8, background: "transparent", color: "#9fb3ff", border: "1px solid #2a3565", fontWeight: 600 }}>
              Clear
            </button>
          </div>
        </form>

        {error && <div style={{ marginTop: 12, color: "#ff9b9b" }}>{error}</div>}
        {answer && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, margin: "8px 0" }}>Answer</h3>
            <div style={{ background: "#0f1530", border: "1px solid #2a3565", borderRadius: 10, padding: 12, whiteSpace: "pre-wrap" }}>
              {answer}
            </div>
          </div>
        )}
        {sources && sources.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, margin: "8px 0", opacity: 0.9 }}>Sources</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {sources.map((s, idx) => (
                <li key={s.id} style={{ fontSize: 13, opacity: 0.9 }}>
                  {idx + 1}. {s.title || "Untitled"} (relevance {Math.round(s.similarity * 100)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <footer style={{ opacity: 0.6, fontSize: 12, marginTop: 28 }}>
        Tip: Set your OPENAI_KEY environment variable in Vercel project settings. This app does not store notes; they exist only in your browser memory during the session.
      </footer>
    </main>
  );
}
