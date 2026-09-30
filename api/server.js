require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const port = Number(process.env.PORT || 3001)
const storageRoot = path.join(__dirname, 'storage')
const audioRoot = path.join(storageRoot, 'audio')
const coverRoot = path.join(storageRoot, 'covers')
for (const folder of [audioRoot, coverRoot]) fs.mkdirSync(folder, { recursive: true })

const db = new Database(path.join(__dirname, 'music.sqlite'))
db.pragma('journal_mode = WAL')
db.exec(`CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT NOT NULL,
  album TEXT, cover_filename TEXT, audio_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`)

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }))
app.use(express.json())

const disk = multer.diskStorage({
  destination: (_, file, done) => done(null, file.fieldname === 'cover' ? coverRoot : audioRoot),
  filename: (_, file, done) => done(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
})
const upload = multer({
  storage: disk,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_, file, done) => {
    const accepted = file.fieldname === 'audio'
      ? file.mimetype.startsWith('audio/')
      : file.mimetype.startsWith('image/')
    if (!accepted) return done(new Error('Arquivo não aceito. Envie áudio ou imagem.'))
    done(null, true)
  },
})

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_TOKEN || req.header('x-admin-token') !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' })
  next()
}
function toTrack(row) {
  return { ...row, coverUrl: row.cover_filename ? `/covers/${row.cover_filename}` : null, streamUrl: `/stream/${row.id}` }
}

app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/tracks', (_, res) => res.json(db.prepare('SELECT * FROM tracks ORDER BY created_at DESC').all().map(toTrack)))
app.get('/covers/:file', (req, res) => res.sendFile(req.params.file, { root: coverRoot }))
app.get('/stream/:id', (req, res) => {
  const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id)
  if (!track) return res.sendStatus(404)
  const file = path.join(audioRoot, track.audio_filename)
  if (!fs.existsSync(file)) return res.sendStatus(404)
  const size = fs.statSync(file).size
  const range = req.headers.range
  res.set({ 'Accept-Ranges': 'bytes', 'Content-Type': track.mime_type })
  if (!range) return res.set('Content-Length', size).sendFile(file)
  const [startValue, endValue] = range.replace(/bytes=/, '').split('-')
  const start = Number(startValue), end = endValue ? Number(endValue) : size - 1
  if (start >= size || end >= size) return res.status(416).set('Content-Range', `bytes */${size}`).end()
  res.status(206).set({ 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 })
  fs.createReadStream(file, { start, end }).pipe(res)
})
app.post('/tracks', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const audio = req.files?.audio?.[0]
  if (!audio || !req.body.title?.trim() || !req.body.artist?.trim()) return res.status(400).json({ error: 'Título, artista e áudio são obrigatórios' })
  const track = { id: crypto.randomUUID(), title: req.body.title.trim(), artist: req.body.artist.trim(), album: req.body.album?.trim() || null, cover_filename: req.files?.cover?.[0]?.filename || null, audio_filename: audio.filename, mime_type: audio.mimetype }
  db.prepare('INSERT INTO tracks (id,title,artist,album,cover_filename,audio_filename,mime_type) VALUES (@id,@title,@artist,@album,@cover_filename,@audio_filename,@mime_type)').run(track)
  res.status(201).json(toTrack(track))
})
app.patch('/tracks/:id', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const previous = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id)
  if (!previous) return res.sendStatus(404)
  const audio = req.files?.audio?.[0]
  const cover = req.files?.cover?.[0]
  const track = {
    ...previous,
    title: req.body.title?.trim() || previous.title,
    artist: req.body.artist?.trim() || previous.artist,
    album: req.body.album?.trim() || previous.album,
    audio_filename: audio?.filename || previous.audio_filename,
    mime_type: audio?.mimetype || previous.mime_type,
    cover_filename: cover?.filename || previous.cover_filename,
  }
  db.prepare('UPDATE tracks SET title=@title, artist=@artist, album=@album, cover_filename=@cover_filename, audio_filename=@audio_filename, mime_type=@mime_type WHERE id=@id').run(track)
  if (audio && previous.audio_filename !== audio.filename) fs.unlink(path.join(audioRoot, previous.audio_filename), () => {})
  if (cover && previous.cover_filename && previous.cover_filename !== cover.filename) fs.unlink(path.join(coverRoot, previous.cover_filename), () => {})
  res.json(toTrack(track))
})
app.use((err, _, res, __) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'O arquivo é maior que o limite de 30 MB.' })
  res.status(400).json({ error: err.message || 'Erro no upload' })
})
app.listen(port, () => console.log(`EJC Music API em http://localhost:${port}`))
