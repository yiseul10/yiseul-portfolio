import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs'
import { basename, extname, join, relative } from 'path'

const sourceDir = process.env.OBSIDIAN_PUBLIC_WIKI_DIR
const targetDir = join(process.cwd(), 'app', 'data', 'wiki')
const keepFiles = new Set(['README.md'])

if (!sourceDir) {
  console.error('OBSIDIAN_PUBLIC_WIKI_DIR 환경변수에 Obsidian 공개 Wiki 폴더 경로를 지정해주세요.')
  console.error('예: OBSIDIAN_PUBLIC_WIKI_DIR="/Users/me/Obsidian/Portfolio Public Wiki" npm run sync:wiki')
  process.exit(1)
}

if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
  console.error(`Obsidian 공개 Wiki 폴더를 찾을 수 없습니다: ${sourceDir}`)
  process.exit(1)
}

mkdirSync(targetDir, { recursive: true })

for (const fileName of readdirSync(targetDir)) {
  if (keepFiles.has(fileName)) continue
  if (extname(fileName) === '.md') {
    rmSync(join(targetDir, fileName))
  }
}

function listMarkdownFiles(dir) {
  return readdirSync(dir).flatMap((fileName) => {
    const fullPath = join(dir, fileName)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) return listMarkdownFiles(fullPath)
    if (stats.isFile() && extname(fileName) === '.md') return [fullPath]
    return []
  })
}

function hasPublicChatbotFlags(raw) {
  return /^---\n[\s\S]*?^chatbot:\s*true\s*$/m.test(raw)
    && /^---\n[\s\S]*?^public_safe:\s*true\s*$/m.test(raw)
}

let copied = 0
let skipped = 0

for (const sourceFile of listMarkdownFiles(sourceDir)) {
  const raw = readFileSync(sourceFile, 'utf-8')
  if (!hasPublicChatbotFlags(raw)) {
    skipped += 1
    continue
  }

  const relativePath = relative(sourceDir, sourceFile)
  const safeName = relativePath.split(/[\\/]/).join('__')
  const targetFile = join(targetDir, safeName || basename(sourceFile))

  copyFileSync(sourceFile, targetFile)
  copied += 1
}

console.log(`Wiki sync complete: ${copied} markdown file(s) copied to app/data/wiki.`)
console.log(`Skipped file(s): ${skipped}.`)
console.log('chatbot: true 와 public_safe: true 가 모두 있는 문서만 복사됩니다.')
