import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'

const base = import.meta.env.VITE_API_URL || '/api'
const emptyForm = { title: '', artist: '', album: '', audio: null, cover: null }

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('ejc-admin-token') || '')
  const [tracks, setTracks] = useState([])
  const [selectedId, setSelectedId] = useState('new')
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { fetch(`${base}/tracks`).then(response => response.json()).then(setTracks).catch(() => setStatus('Não foi possível carregar a biblioteca.')) }, [])
  function selectTrack(id) {
    setSelectedId(id)
    setStatus('')
    if (id === 'new') return setForm(emptyForm)
    const track = tracks.find(item => item.id === id)
    if (track) setForm({ title: track.title, artist: track.artist, album: track.album || '', audio: null, cover: null })
  }
  function change(event) {
    const { name, value, files } = event.target
    setForm(current => ({ ...current, [name]: files ? files[0] : value }))
  }
  async function submit(event) {
    event.preventDefault()
    const editing = selectedId !== 'new'
    if (!token || (!editing && !form.audio)) return setStatus('Informe o token e escolha um arquivo de áudio.')
    setSending(true); setStatus(editing ? 'Atualizando música…' : 'Enviando música…')
    const data = new FormData()
    for (const [key, value] of Object.entries(form)) if (value) data.append(key, value)
    try {
      const url = editing ? `${base}/tracks/${selectedId}` : `${base}/tracks`
      const response = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'x-admin-token': token }, body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a música.')
      sessionStorage.setItem('ejc-admin-token', token)
      setTracks(current => editing ? current.map(track => track.id === result.id ? result : track) : [result, ...current])
      setSelectedId(result.id)
      setForm({ title: result.title, artist: result.artist, album: result.album || '', audio: null, cover: null })
      event.target.reset()
      setStatus(editing ? `“${result.title}” foi atualizada.` : `“${result.title}” foi adicionada à biblioteca.`)
    } catch (error) { setStatus(error.message) } finally { setSending(false) }
  }
  const editing = selectedId !== 'new'

  return <main className="min-h-screen bg-ink px-6 py-8 text-white"><div className="mx-auto max-w-xl">
    <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-acid no-underline"><ArrowLeft size={16}/> Voltar para EJC Music</a>
    <p className="mt-16 text-xs font-bold tracking-[.2em] text-acid">ADMINISTRAÇÃO</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight">{editing ? 'Editar canção' : 'Adicionar canção'}</h1>
    <p className="mt-4 leading-7 text-white/55">Envie uma música nova ou selecione uma já publicada para trocar o áudio, capa e informações.</p>
    <label className="mt-8 block text-sm font-bold">Música a editar<select value={selectedId} onChange={event => selectTrack(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#181818] px-4 py-3 font-normal text-white outline-none focus:border-acid"><option value="new">Nova música</option>{tracks.map(track => <option key={track.id} value={track.id}>{track.title} — {track.artist}</option>)}</select></label>
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl bg-white/6 p-6">
      <label className="block text-sm font-bold">Token de administrador<input required type="password" value={token} onChange={event => setToken(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-acid" placeholder="ADMIN_TOKEN" /></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Título<input required name="title" value={form.title} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" /></label><label className="block text-sm font-bold">Artista<input required name="artist" value={form.artist} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" /></label></div>
      <label className="block text-sm font-bold">Álbum ou encontro <span className="font-normal text-white/40">(opcional)</span><input name="album" value={form.album} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" placeholder="EJC 2026" /></label>
      <label className="block text-sm font-bold">{editing ? 'Novo arquivo de áudio' : 'Arquivo de áudio'} {editing && <span className="font-normal text-white/40">(deixe vazio para manter o atual)</span>}<input required={!editing} name="audio" type="file" accept="audio/*" onChange={change} className="mt-2 block w-full text-sm font-normal text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-acid file:px-3 file:py-2 file:font-bold file:text-black" /></label>
      <label className="block text-sm font-bold">Nova capa <span className="font-normal text-white/40">(opcional)</span><input name="cover" type="file" accept="image/*" onChange={change} className="mt-2 block w-full text-sm font-normal text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-acid file:px-3 file:py-2 file:font-bold file:text-black" /></label>
      {status && <p className="rounded-xl bg-black/25 px-4 py-3 text-sm text-white/70">{status}</p>}
      <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-acid px-5 py-3 font-bold text-black disabled:opacity-50">{editing ? <Pencil size={16}/> : <Plus size={18}/>} {sending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Publicar música'}</button>
    </form>
  </div></main>
}
