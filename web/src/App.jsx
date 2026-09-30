import { useEffect, useRef, useState } from 'react'
import Admin from './Admin.jsx'

const base = import.meta.env.VITE_API_URL || '/api'

export default function App() {
  if (window.location.pathname === '/admin') return <Admin />
  const [tracks, setTracks] = useState([])
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const audio = useRef(null)

  useEffect(() => {
    fetch(`${base}/tracks`).then(r => r.ok ? r.json() : Promise.reject()).then(setTracks).catch(() => setError('A biblioteca estará disponível quando a API estiver online.'))
  }, [])
  useEffect(() => {
    if (!current) return
    audio.current.src = `${base}${current.streamUrl}`
    audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [current])
  function toggle() { if (!audio.current || !current) return; playing ? audio.current.pause() : audio.current.play(); setPlaying(!playing) }

  return <main className="min-h-screen bg-ink font-sans text-white selection:bg-acid selection:text-black">
    <audio ref={audio} onEnded={() => setPlaying(false)} />
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7"><a href="/" aria-label="EJC Music"><img src="/logo_encontro.png" alt="Encontro de Jovens com Cristo" className="h-12 w-auto object-contain" /></a><span className="flex items-center gap-4"><a href="/admin" className="text-xs font-bold text-white/45 no-underline hover:text-acid">ADMIN</a><span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">Encontro de Jovens com Cristo</span></span></header>
    <section className="mx-auto max-w-6xl px-6 pt-14 pb-36"><p className="text-acid text-sm font-bold tracking-[.22em]">A TRILHA DO NOSSO ENCONTRO</p><h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">Fé que une.<br/>Som que fica.</h1>
      <p className="mt-6 max-w-md text-base leading-7 text-white/55">Canções para lembrar que Cristo é o centro e que ninguém caminha sozinho.</p>
      {error && <p className="mt-8 rounded-xl bg-white/8 p-4 text-sm text-white/60">{error}</p>}
      <div className="mt-12 flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.18em] text-white/45">NOSSA BIBLIOTECA</p><h2 className="mt-2 text-2xl font-bold">Músicas do EJC</h2></div><span className="text-sm text-white/45">{tracks.length} {tracks.length === 1 ? 'canção' : 'canções'}</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tracks.map((track, index) => <button key={track.id} onClick={() => setCurrent(track)} className={`flex items-center gap-4 rounded-2xl p-3 text-left transition ${current?.id === track.id ? 'bg-acid text-black' : 'bg-white/6 hover:bg-white/12'}`}>
        {track.coverUrl ? <img className="h-16 w-16 rounded-xl object-cover" src={`${base}${track.coverUrl}`} alt={`Capa de ${track.title}`}/> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-white/10 text-lg">✦</div>}<span className="min-w-0"><b className="block truncate">{track.title}</b><small className="block truncate opacity-60">{track.artist}{track.album ? ` · ${track.album}` : ''}</small></span><span className="ml-auto opacity-50">{index + 1}</span>
      </button>)}</div>
      {!tracks.length && !error && <p className="mt-12 text-white/50">A primeira canção do encontro começa aqui.</p>}
    </section>
    {current && <footer className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#161616]/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3"><div className="min-w-0 flex-1"><b className="block truncate">{current.title}</b><small className="text-white/55">{current.artist}</small></div><button onClick={toggle} className="grid h-11 w-11 place-items-center rounded-full bg-acid text-xl text-black">{playing ? 'Ⅱ' : '▶'}</button></div></footer>}
  </main>
}
