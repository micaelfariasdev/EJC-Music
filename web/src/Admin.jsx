import { useState } from 'react'

const base = import.meta.env.VITE_API_URL || '/api'

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('ejc-admin-token') || '')
  const [form, setForm] = useState({ title: '', artist: '', album: '', audio: null, cover: null })
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  function change(event) {
    const { name, value, files } = event.target
    setForm(current => ({ ...current, [name]: files ? files[0] : value }))
  }
  async function submit(event) {
    event.preventDefault()
    if (!token || !form.audio) return setStatus('Informe o token e escolha um arquivo de áudio.')
    setSending(true); setStatus('Enviando música…')
    const data = new FormData()
    for (const [key, value] of Object.entries(form)) if (value) data.append(key, value)
    try {
      const response = await fetch(`${base}/tracks`, { method: 'POST', headers: { 'x-admin-token': token }, body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar')
      sessionStorage.setItem('ejc-admin-token', token)
      setForm({ title: '', artist: '', album: '', audio: null, cover: null })
      event.target.reset()
      setStatus(`“${result.title}” foi adicionada à biblioteca.`)
    } catch (error) { setStatus(error.message) } finally { setSending(false) }
  }

  return <main className="min-h-screen bg-ink px-6 py-8 text-white"><div className="mx-auto max-w-xl">
    <a href="/" className="text-sm font-bold text-acid no-underline">← Voltar para EJC Music</a>
    <p className="mt-16 text-xs font-bold tracking-[.2em] text-acid">ADMINISTRAÇÃO</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight">Adicionar canção</h1>
    <p className="mt-4 leading-7 text-white/55">Envie músicas e capas para a biblioteca do encontro. Somente quem possui o token da API pode publicar.</p>
    <form onSubmit={submit} className="mt-10 space-y-5 rounded-3xl bg-white/6 p-6">
      <label className="block text-sm font-bold">Token de administrador<input required type="password" value={token} onChange={e => setToken(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-acid" placeholder="ADMIN_TOKEN" /></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Título<input required name="title" value={form.title} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" placeholder="Ex.: Deus Proverá" /></label><label className="block text-sm font-bold">Artista<input required name="artist" value={form.artist} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" placeholder="Artista ou ministério" /></label></div>
      <label className="block text-sm font-bold">Álbum ou encontro <span className="font-normal text-white/40">(opcional)</span><input name="album" value={form.album} onChange={change} className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-normal text-white outline-none focus:border-acid" placeholder="EJC 2026" /></label>
      <label className="block text-sm font-bold">Arquivo de áudio<input required name="audio" type="file" accept="audio/*" onChange={change} className="mt-2 block w-full text-sm font-normal text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-acid file:px-3 file:py-2 file:font-bold file:text-black" /></label>
      <label className="block text-sm font-bold">Capa <span className="font-normal text-white/40">(opcional)</span><input name="cover" type="file" accept="image/*" onChange={change} className="mt-2 block w-full text-sm font-normal text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-acid file:px-3 file:py-2 file:font-bold file:text-black" /></label>
      {status && <p className="rounded-xl bg-black/25 px-4 py-3 text-sm text-white/70">{status}</p>}
      <button disabled={sending} className="w-full rounded-xl bg-acid px-5 py-3 font-bold text-black disabled:opacity-50">{sending ? 'Enviando…' : 'Publicar música'}</button>
    </form>
  </div></main>
}
