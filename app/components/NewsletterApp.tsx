'use client'

import { useState } from 'react'
import type { NewsletterListItem } from '@/lib/newsletter-list'

type Summary = {
  id: string
  videoTitle: string
  keyTakeaways: string[]
  playerHighlights: string[]
  paragraph: string
  suggestedSubjectLine: string
  originalTranscript: string
  createdAt: string
}

type Link = {
  id: string
  youtubeUrl: string
  videoTitle: string | null
  status: 'PENDING' | 'PROCESSING' | 'INVALID' | 'PROCESSED' | 'FAILED'
  errorMessage: string | null
  summary: Summary | null
  addedAt: string
}

type FullNewsletter = {
  id: string
  name: string
  draft: string | null
  createdAt: string
  updatedAt: string
  links: Link[]
}

type NewsletterAppProps = {
  initialNewsletters: NewsletterListItem[]
}

export default function NewsletterApp({ initialNewsletters }: NewsletterAppProps) {
  const [newsletters, setNewsletters] = useState<NewsletterListItem[]>(initialNewsletters)
  const [active, setActive] = useState<FullNewsletter | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function loadNewsletters() {
    const res = await fetch('/api/newsletters')
    if (res.ok) setNewsletters(await res.json())
  }

  async function loadNewsletter(id: string) {
    const res = await fetch(`/api/newsletters/${id}`)
    if (res.ok) setActive(await res.json())
  }

  async function deleteNewsletter(id: string) {
    const res = await fetch(`/api/newsletters/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (active?.id === id) setActive(null)
      setConfirmDelete(null)
      await loadNewsletters()
    }
  }

  async function createNewsletter() {
    const res = await fetch('/api/newsletters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    if (res.ok) {
      const n = await res.json()
      await loadNewsletters()
      await loadNewsletter(n.id)
    }
  }

  async function addLink() {
    if (!urlInput.trim() || !active) return
    setAddingLink(true)
    setError(null)
    const res = await fetch(`/api/newsletters/${active.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setUrlInput('')
      await loadNewsletter(active.id)
      await loadNewsletters()
    }
    setAddingLink(false)
  }

  async function removeLink(linkId: string) {
    if (!active) return
    const res = await fetch(`/api/newsletters/${active.id}/links/${linkId}`, { method: 'DELETE' })
    if (res.ok) {
      await loadNewsletter(active.id)
      await loadNewsletters()
    }
  }

  async function processLinks() {
    if (!active) return
    setProcessing(true)
    setError(null)
    const res = await fetch(`/api/newsletters/${active.id}/process`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setActive(updated)
      await loadNewsletters()
    } else {
      const data = await res.json()
      setError(data.error || 'Processing failed')
    }
    setProcessing(false)
  }

  async function renameNewsletter() {
    if (!active || !renameValue.trim()) return
    const res = await fetch(`/api/newsletters/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    if (res.ok) {
      await loadNewsletter(active.id)
      await loadNewsletters()
      setRenaming(false)
    }
  }

  function copyAll() {
    if (!active?.draft) return
    navigator.clipboard.writeText(active.draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleTranscript(id: string) {
    setExpandedTranscripts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const pendingLinks = active?.links.filter((l) => l.status === 'PENDING') ?? []
  const processedLinks = active?.links.filter((l) => l.status === 'PROCESSED') ?? []
  const rejectedFantasyLinks = active?.links.filter((l) => l.status === 'INVALID') ?? []
  const failedLinks = active?.links.filter((l) => l.status === 'FAILED') ?? []
  const problemLinksCount = rejectedFantasyLinks.length + failedLinks.length
  const totalLinks = active?.links.length ?? 0
  const hasProcessed = processedLinks.length > 0

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Sidebar ── */}
      <aside className="w-72 bg-zinc-50 flex flex-col border-r border-zinc-200 shrink-0">
        <div className="p-4 border-b border-zinc-200">
          <button
            onClick={createNewsletter}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Start New Issue 📝
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {newsletters.length === 0 ? (
            <p className="text-zinc-400 text-xs text-center py-8 px-4">No issues yet</p>
          ) : (
            newsletters.map((n) => (
              <div
                key={n.id}
                className={`group relative flex items-center transition-colors mx-2 rounded-lg mb-1 ${
                  active?.id === n.id ? 'bg-white shadow-sm border border-zinc-200' : 'hover:bg-zinc-100 border border-transparent'
                }`}
              >
                <button
                  onClick={() => loadNewsletter(n.id)}
                  className="flex-1 text-left px-3 py-2.5 min-w-0"
                >
                  <p className="text-sm font-semibold text-zinc-800 truncate">{n.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {n.summaryCount}/{n.linkCount} sources
                  </p>
                </button>
                {confirmDelete === n.id ? (
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <button
                      onClick={() => deleteNewsletter(n.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-1"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(n.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity pr-3 text-zinc-400 hover:text-red-500 shrink-0"
                    title="Delete issue"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto bg-white">
        {!active ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-zinc-400">
              <div className="text-5xl mb-4 opacity-50">🏈</div>
              <p className="text-lg font-medium text-zinc-800">Ready to write?</p>
              <p className="text-sm mt-1 text-zinc-500">Click &quot;Start New Issue&quot; to get started</p>
            </div>
          </div>
        ) : hasProcessed ? (
          /* ── Newsletter Draft View ── */
          <div className="max-w-3xl mx-auto py-12 px-8">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                {renaming ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameNewsletter()
                        if (e.key === 'Escape') setRenaming(false)
                      }}
                      className="text-3xl font-bold border-b-2 border-zinc-300 bg-transparent outline-none w-full text-zinc-900"
                      autoFocus
                    />
                    <button onClick={renameNewsletter} className="text-sm text-zinc-600 hover:text-zinc-900 font-medium shrink-0">Save</button>
                    <button onClick={() => setRenaming(false)} className="text-sm text-zinc-400 hover:text-zinc-600 shrink-0">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-zinc-900 truncate tracking-tight">{active.name}</h1>
                    <button
                      onClick={() => { setRenameValue(active.name); setRenaming(true) }}
                      className="text-zinc-300 hover:text-zinc-600 text-sm shrink-0 transition-colors"
                      title="Rename"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <p className="text-sm text-zinc-500 mt-2">
                  Based on {processedLinks.length} {processedLinks.length === 1 ? 'source' : 'sources'} · Drafted{' '}
                  {new Date(active.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={copyAll}
                disabled={!active.draft}
                className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 shadow-sm disabled:opacity-50'
                }`}
              >
                {copied ? '✓ Copied to clipboard' : 'Copy Text'}
              </button>
            </div>

            {/* Rejected or failed links */}
            {problemLinksCount > 0 && (
              <div className="mb-6 space-y-3">
                {rejectedFantasyLinks.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-semibold text-red-700 mb-3">
                      ⚠️ Not treated as fantasy football ({rejectedFantasyLinks.length})
                    </p>
                    <div className="space-y-2">
                      {rejectedFantasyLinks.map((link) => (
                        <div key={link.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-red-700 truncate">
                              {link.videoTitle || link.youtubeUrl}
                            </p>
                            <p className="text-xs text-red-500 mt-0.5">{link.errorMessage}</p>
                          </div>
                          <button
                            onClick={() => removeLink(link.id)}
                            className="text-xs text-red-400 hover:text-red-600 shrink-0 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {failedLinks.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Processing error (transcript, AI, or network — check server logs)
                    </p>
                    <p className="text-xs text-amber-800/80 mb-3">
                      Look for <code className="bg-amber-100 px-1 rounded">[newsletter-process]</code> in the terminal running{' '}
                      <code className="bg-amber-100 px-1 rounded">next dev</code>.
                    </p>
                    <div className="space-y-2">
                      {failedLinks.map((link) => (
                        <div key={link.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-amber-900 truncate">
                              {link.videoTitle || link.youtubeUrl}
                            </p>
                            <p className="text-xs text-amber-800 mt-0.5 break-words">{link.errorMessage}</p>
                          </div>
                          <button
                            onClick={() => removeLink(link.id)}
                            className="text-xs text-amber-700 hover:text-amber-900 shrink-0 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Newsletter draft — the main output */}
            {active.draft && (
              <div className="bg-[#FAFAFA] border border-zinc-200 rounded-lg p-8 shadow-sm mb-10">
                <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-[15px] text-zinc-800 leading-relaxed font-serif">
                  {active.draft}
                </div>
              </div>
            )}

            {/* Collapsible source summaries */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-800 list-none flex items-center gap-2 mb-4 transition-colors">
                <span className="group-open:rotate-90 transition-transform inline-block text-xs">▶</span>
                View source notes ({processedLinks.length})
              </summary>
              <div className="space-y-4 mt-4 border-l-2 border-zinc-100 pl-4 ml-1">
                {processedLinks.map((link) => {
                  const s = link.summary!
                  const expanded = expandedTranscripts.has(s.id)
                  return (
                    <div key={link.id} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                      <p className="text-xs text-zinc-400 mb-1 truncate">{link.youtubeUrl}</p>
                      <h3 className="text-base font-bold text-zinc-800 mb-4">{s.videoTitle}</h3>

                      <div className="mb-4">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Key Takeaways</p>
                        <ul className="space-y-1.5">
                          {s.keyTakeaways.map((t, i) => (
                            <li key={i} className="text-sm text-zinc-600 flex gap-2">
                              <span className="text-zinc-300 shrink-0">—</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Player Highlights</p>
                        <ul className="space-y-1.5">
                          {s.playerHighlights.map((p, i) => (
                            <li key={i} className="text-sm text-zinc-600 flex gap-2">
                              <span className="text-zinc-300 shrink-0">—</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => toggleTranscript(s.id)}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {expanded ? 'Hide transcript' : 'View raw transcript'}
                      </button>
                      {expanded && (
                        <div className="mt-3 p-4 bg-zinc-50 rounded text-xs text-zinc-500 leading-relaxed max-h-64 overflow-y-auto font-mono">
                          {s.originalTranscript}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        ) : (
          /* ── Add Links View ── */
          <div className="max-w-xl mx-auto py-16 px-6">
            <div className="mb-10 text-center">
              {renaming ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameNewsletter()
                      if (e.key === 'Escape') setRenaming(false)
                    }}
                    className="text-2xl font-bold border-b-2 border-zinc-300 bg-transparent outline-none text-center text-zinc-900"
                    autoFocus
                  />
                  <button onClick={renameNewsletter} className="text-sm text-zinc-600 hover:text-zinc-900 font-medium">Save</button>
                  <button onClick={() => setRenaming(false)} className="text-sm text-zinc-400 hover:text-zinc-600">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{active.name}</h1>
                  <button
                    onClick={() => { setRenameValue(active.name); setRenaming(true) }}
                    className="text-zinc-300 hover:text-zinc-600 text-sm transition-colors"
                    title="Rename"
                  >
                    ✎
                  </button>
                </div>
              )}
              <p className="text-sm text-zinc-500 mt-2">Drop YouTube links below to build your issue (max 12)</p>
            </div>

            {/* URL Input */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
                  placeholder="Paste YouTube URL..."
                  disabled={addingLink || processing || totalLinks >= 12}
                  className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-50 shadow-sm"
                />
                <button
                  onClick={addLink}
                  disabled={!urlInput.trim() || addingLink || processing || totalLinks >= 12}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  {addingLink ? 'Adding...' : 'Add Link'}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1">
                {error ? (
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs font-medium ${totalLinks >= 12 ? 'text-red-500' : 'text-zinc-400'}`}>
                  {totalLinks}/12 sources
                </p>
              </div>
            </div>

            {/* Rejected / failed links in add mode */}
            {rejectedFantasyLinks.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-red-600">Not treated as fantasy football:</p>
                {rejectedFantasyLinks.map((link) => (
                  <div key={link.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-red-600 truncate">{link.videoTitle || link.youtubeUrl}</p>
                      <p className="text-xs text-red-400">{link.errorMessage}</p>
                    </div>
                    <button onClick={() => removeLink(link.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}
            {failedLinks.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-amber-900">Processing error — check terminal for [newsletter-process] logs</p>
                {failedLinks.map((link) => (
                  <div key={link.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-amber-900 truncate">{link.videoTitle || link.youtubeUrl}</p>
                      <p className="text-xs text-amber-800 break-words">{link.errorMessage}</p>
                    </div>
                    <button onClick={() => removeLink(link.id)} className="text-xs text-amber-700 hover:text-amber-900 shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending links */}
            {pendingLinks.length > 0 && (
              <div className="mb-6 space-y-2">
                {pendingLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {link.videoTitle || link.youtubeUrl}
                      </p>
                      {link.videoTitle && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{link.youtubeUrl}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeLink(link.id)}
                      disabled={processing}
                      className="text-zinc-300 hover:text-red-500 transition-colors text-lg shrink-0 leading-none px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Processing progress */}
            {processing && (
              <div className="mb-6 p-6 bg-zinc-50 border border-zinc-200 rounded-lg text-center shadow-sm">
                <p className="text-sm font-semibold text-zinc-800 animate-pulse">Watching the tape & writing the draft...</p>
                <p className="text-xs text-zinc-500 mt-2">This might take a minute or two.</p>
              </div>
            )}

            <button
              onClick={processLinks}
              disabled={pendingLinks.length === 0 || processing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
              {processing ? 'Drafting...' : `Draft Issue (${pendingLinks.length} sources)`}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
