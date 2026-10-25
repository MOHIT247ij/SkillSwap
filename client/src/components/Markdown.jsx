// Tiny safe markdown renderer for AI replies: **bold**, `code`, lists, paragraphs.
// HTML inject nahi hota (sab React elements hain), isliye XSS-safe hai.
function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <b key={`${key}-${i}`} className="font-semibold">{p.slice(2, -2)}</b>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={`${key}-${i}`} className="px-1 py-0.5 rounded bg-black/10 text-[0.85em]">{p.slice(1, -1)}</code>;
    return p.replace(/^#+\s*/, '');
  });
}

export default function Markdown({ text = '' }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)/);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (!list || list.type !== type) { flush(); list = { type, items: [] }; }
      list.items.push(ul ? ul[1] : ol[2]);
    } else if (!line.trim()) {
      flush();
    } else {
      flush();
      blocks.push({ type: line.startsWith('#') ? 'h' : 'p', text: line });
    }
  });
  flush();

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1">{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ul>;
        if (b.type === 'ol') return <ol key={i} className="list-decimal pl-5 space-y-1">{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ol>;
        if (b.type === 'h') return <p key={i} className="font-bold">{inline(b.text, i)}</p>;
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
}
