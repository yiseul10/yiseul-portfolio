const MAX_CHUNK_LENGTH = 800

/**
 * 마크다운을 chunk 배열로 분할한다.
 * 1차: `##` 헤딩 단위. 2차: 섹션이 상한 초과 시 문단(빈 줄) 경계로 합쳐가며 분할.
 * 문장 중간을 자르지 않는다(단일 문단이 상한보다 길면 그대로 한 chunk).
 */
export function chunkMarkdown(mdx: string): string[] {
  if (!mdx || !mdx.trim()) return []

  const sections = mdx
    .split(/\n(?=##\s)/)
    .map((section) => section.trim())
    .filter(Boolean)

  const chunks: string[] = []

  for (const section of sections) {
    if (section.length <= MAX_CHUNK_LENGTH) {
      chunks.push(section)
      continue
    }

    const paragraphs = section
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    let buffer = ''
    for (const paragraph of paragraphs) {
      if (buffer && buffer.length + paragraph.length + 2 > MAX_CHUNK_LENGTH) {
        chunks.push(buffer)
        buffer = ''
      }
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph
    }
    if (buffer) chunks.push(buffer)
  }

  return chunks
}
