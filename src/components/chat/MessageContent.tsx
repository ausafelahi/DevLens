function parseSegments(content: string) {
  const segments: { type: "text" | "code"; content: string; lang?: string }[] =
    [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "code",
      lang: match[1] || "text",
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }
  return segments;
}

export function MessageContent({ content }: { content: string }) {
  const segments = parseSegments(content);

  return (
    <div className="space-y-2">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-[#2E3444]"
          >
            <div className="flex items-center justify-between bg-[#0F1119] px-3 py-1 font-mono text-[11px] text-[#8B90A3]">
              <span>{seg.lang}</span>
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[#E8A33D]/40" />
                <span className="h-2 w-2 rounded-full bg-[#E8A33D]/40" />
                <span className="h-2 w-2 rounded-full bg-[#E8A33D]/40" />
              </span>
            </div>
            <pre className="overflow-x-auto bg-[#0F1119] p-3 font-mono text-[13px] leading-relaxed text-[#C9E8A0]">
              {seg.content.trim()}
            </pre>
          </div>
        ) : (
          <p
            key={i}
            className="whitespace-pre-wrap text-[15px] leading-relaxed"
          >
            {seg.content.trim()}
          </p>
        ),
      )}
    </div>
  );
}
