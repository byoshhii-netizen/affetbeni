import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, 'data')
const settingsFile = path.join(dataDirectory, 'settings.json')
const actionsFile = path.join(dataDirectory, 'actions.json')
const defaults = { question: 'Ben bir eşşeğim, beni affeder misin?', yesLabel: 'Affettim', noLabel: 'Hayır', successMessage: 'Çok teşekkür ederim. Bu dağ ayısı çok mutlu oldu!', foreverMessage: 'Beni bir kez affettin, bir daha affetmen gereken bir durum yaratmayacağım. 💙💙', photoUrl: '', noMessages: ['Emin misin?', 'Bir daha denesen?', 'Ama tatlısın?', 'Ama üzülüyorum?', 'Çay içsen?', 'Aa ama yapma?'] }

async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback } }
async function writeJson(file, value) { await fs.mkdir(dataDirectory, { recursive: true }); await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8') }

const app = express()
app.use(express.json())
app.get('/api/settings', async (_request, response) => response.json({ ...defaults, ...(await readJson(settingsFile, {})) }))
app.put('/api/settings', async (request, response) => { const settings = { ...defaults, ...request.body }; await writeJson(settingsFile, settings); response.json(settings) })
app.get('/api/actions', async (_request, response) => response.json(await readJson(actionsFile, [])))
app.delete('/api/actions', async (_request, response) => { await writeJson(actionsFile, []); response.json({ ok: true }) })
app.post('/api/actions', async (request, response) => { const actions = await readJson(actionsFile, []); const forwardedIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim(); const remoteIp = forwardedIp || request.socket.remoteAddress || 'unknown'; const ip = remoteIp.replace(/^::ffff:/, ''); actions.unshift({ action: request.body.action === 'yes' ? 'yes' : 'no', noCount: Number(request.body.noCount) || 0, sessionId: String(request.body.sessionId || 'unknown'), ip, createdAt: new Date().toISOString() }); await writeJson(actionsFile, actions); response.status(201).json({ ok: true }) })

app.use(express.static(path.join(__dirname, 'dist')))
app.use((_request, response) => response.sendFile(path.join(__dirname, 'dist', 'index.html')))

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`AffetBeni server running on http://localhost:${port}`))
