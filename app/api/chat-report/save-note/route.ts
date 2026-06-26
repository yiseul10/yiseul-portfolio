import { mkdir, writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import { createServerSupabase } from '@lib/supabase-server'

function getDefaultObsidianDir(): string {
  return join(homedir(), 'Documents', 'Obsidian Vault', 'wiki', 'projects', 'portpolio2', 'chat-report-weekly')
}

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.replace(/[\\/:*?"<>|]/g, '-').trim()
  return normalized.endsWith('.md') ? normalized : `${normalized}.md`
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return Response.json({ error: '로그인 후 저장할 수 있습니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content : ''
  const fileName = typeof body?.fileName === 'string' ? body.fileName : ''

  if (!content || !fileName) {
    return Response.json({ error: '저장할 내용이나 파일명이 비어 있습니다.' }, { status: 400 })
  }

  const targetDir = process.env.OBSIDIAN_CHAT_REPORT_DIR || getDefaultObsidianDir()
  const safeFileName = sanitizeFileName(fileName)
  const targetPath = join(targetDir, safeFileName)

  await mkdir(targetDir, { recursive: true })
  await writeFile(targetPath, content, 'utf-8')

  return Response.json({
    ok: true,
    path: targetPath,
  })
}
