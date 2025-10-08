export const metadata = { title: "RAG Notes", description: "A note taking app with retrieval augmented generation" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', backgroundColor: '#0b1020', color: '#eaeefb' }}>
        {children}
      </body>
    </html>
  );
}
