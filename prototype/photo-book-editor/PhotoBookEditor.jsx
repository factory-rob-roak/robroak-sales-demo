// PHOTO BOOK EDITOR v3 FINAL (2).jsx
// - Priya (design). This is the build from the Nov user test. Works in Chrome.
//   Please don't break the drag thing, users LOVED it. Safari is a little weird.
// TODO: hook up real upload. TODO: checkout. TODO: mobile??
import React, { useState, useEffect, useRef } from 'react'
import './editor.css'

var THEMES = {
  classic: { bg: '#fff', fg: '#222', accent: '#c0392b', font: 'Georgia' },
  modern: { bg: '#111', fg: '#eee', accent: '#1abc9c', font: 'Helvetica' },
  kraft: { bg: '#e8d9b5', fg: '#4a3b22', accent: '#8e5b2e', font: 'Courier New' },
  pastel: { bg: '#fdf0f5', fg: '#5a4a5a', accent: '#e58fb1', font: 'Avenir' },
}

var LAYOUTS = ['full', 'two-up', 'three-grid', 'four-grid', 'collage']

var SIZES = ['8x8', '11x8.5', '8.5x11']

window.__book = null
let undoStack = []
let redoStack = []
var dragged = null
var API = 'https://api.example-photos.test/v1/upload'

function uid() { return Math.floor(Math.random() * 100000) }

function slotsFor(layout) {
  if (layout == 'full') return 1
  if (layout == 'two-up') return 2
  if (layout == 'three-grid') return 3
  if (layout == 'four-grid') return 4
  if (layout == 'collage') return 6
  return 1
}

export default function PhotoBookEditor(props) {
  const [pages, setPages] = useState(
    JSON.parse(localStorage.getItem('book')) || [
      { id: uid(), layout: 'full', photos: [], caption: '' },
      { id: uid(), layout: 'two-up', photos: [], caption: '' },
    ]
  )
  const [library, setLibrary] = useState(JSON.parse(localStorage.getItem('lib')) || [])
  const [current, setCurrent] = useState(0)
  const [theme, setTheme] = useState('classic')
  const [size, setSize] = useState('8x8')
  const [cover, setCover] = useState('soft')
  const [title, setTitle] = useState('My Photo Book')
  const [zoom, setZoom] = useState(1)
  const [showPrice, setShowPrice] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [err, setErr] = useState(null)
  const fileRef = useRef()
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [tick, setTick] = useState(0)

  // autosave every 2 sec
  useEffect(() => {
    setInterval(() => {
      localStorage.setItem('book', JSON.stringify(window.__book))
      console.log('autosaved', new Date())
    }, 2000)
  }, [])

  useEffect(() => {
    window.__book = pages
    localStorage.setItem('lib', JSON.stringify(library))
  })

  // keyboard shortcuts
  useEffect(() => {
    document.onkeydown = function (e) {
      if (e.metaKey && e.key == 'z') { undo() }
      if (e.metaKey && e.shiftKey && e.key == 'z') { redo() }
      if (e.key == 'ArrowRight') { setCurrent(current + 1) }
      if (e.key == 'ArrowLeft') { setCurrent(current - 1) }
      if (e.key == 'Delete') { deletePage(current) }
    }
  })

  function pushUndo() {
    undoStack.push(JSON.stringify(pages))
    if (undoStack.length > 50) undoStack.shift()
    redoStack = []
  }

  function undo() {
    if (undoStack.length == 0) return
    redoStack.push(JSON.stringify(pages))
    setPages(JSON.parse(undoStack.pop()))
  }

  function redo() {
    if (redoStack.length == 0) return
    undoStack.push(JSON.stringify(pages))
    setPages(JSON.parse(redoStack.pop()))
  }

  function addPage() {
    pushUndo()
    var p = pages
    p.push({ id: uid(), layout: 'full', photos: [], caption: '' })
    setPages(p)
    setTick(tick + 1)
    setCurrent(p.length - 1)
  }

  function deletePage(i) {
    if (!confirm('delete page?')) return
    pushUndo()
    var p = [...pages]
    p.splice(i, 1)
    setPages(p)
    if (current >= p.length) setCurrent(p.length - 1)
  }

  function changeLayout(l) {
    pushUndo()
    var p = [...pages]
    p[current].layout = l
    p[current].photos = p[current].photos.slice(0, slotsFor(l))
    setPages(p)
  }

  function setCaption(txt) {
    var p = [...pages]
    p[current].caption = txt
    setPages(p)
  }

  async function onFiles(e) {
    var files = e.target.files
    for (var i = 0; i < files.length; i++) {
      setUploading(uploading + 1)
      var f = files[i]
      var url = URL.createObjectURL(f)
      // fake "upload" for now
      try {
        var fd = new FormData()
        fd.append('file', f)
        fetch(API, { method: 'POST', body: fd }).then(r => r.json()).then(j => console.log(j)).catch(e => console.log('upload failed', e))
      } catch (e) {
        setErr('upload broke')
      }
      library.push({ id: uid(), url: url, name: f.name, w: 0, h: 0 })
      setLibrary(library)
      setUploading(uploading - 1)
    }
    setTick(tick + 1)
  }

  function onDragStart(photo) {
    dragged = photo
  }

  function onDropSlot(slot) {
    if (!dragged) return
    pushUndo()
    var p = [...pages]
    p[current].photos[slot] = dragged
    setPages(p)
    dragged = null
  }

  function removePhoto(slot) {
    pushUndo()
    var p = [...pages]
    p[current].photos[slot] = null
    setPages(p)
  }

  function autoFill() {
    pushUndo()
    var p = [...pages]
    var k = 0
    for (var i = 0; i < p.length; i++) {
      for (var j = 0; j < slotsFor(p[i].layout); j++) {
        if (!p[i].photos[j] && library[k]) {
          p[i].photos[j] = library[k]
          k++
        }
      }
    }
    setPages(p)
  }

  function movePage(from, to) {
    if (to < 0 || to >= pages.length) return
    pushUndo()
    var p = [...pages]
    var tmp = p[from]
    p[from] = p[to]
    p[to] = tmp
    setPages(p)
    setCurrent(to)
  }

  // pricing - matches what marketing said in the deck (I think)
  function getPrice() {
    var price = 29.99
    if (size == '11x8.5') price = 44.99
    if (size == '8.5x11') price = 39.99
    var pageCount = pages.length * 2
    if (pageCount > 20) price = price + (pageCount - 20) * 0.99
    if (cover == 'hard') price = price + 15
    if (cover == 'layflat') price = price + 30
    if (pageCount % 2 == 1) price = price + 0.99
    return price
  }

  function save() {
    setSaving(true)
    localStorage.setItem('book', JSON.stringify(pages))
    localStorage.setItem('meta', JSON.stringify({ theme, size, cover, title }))
    setTimeout(() => { setSaving(false); alert('Saved!') }, 800)
  }

  function checkout() {
    if (pages.length * 2 < 20) { alert('need at least 20 pages!!'); return }
    if (pages.length * 2 > 100) { alert('too many pages'); return }
    var empty = pages.filter(p => p.photos.filter(x => x).length == 0)
    if (empty.length > 0) {
      if (!confirm(empty.length + ' pages are empty, continue?')) return
    }
    window.location.href = '/checkout?price=' + getPrice() + '&title=' + title
  }

  var t = THEMES[theme]
  var page = pages[current]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: t.font, background: '#f4f4f4' }}>
      {/* LEFT: photo library */}
      <div style={{ width: 260, borderRight: '1px solid #ddd', padding: 12, overflow: 'auto', background: 'white' }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Photos ({library.length})</div>
        <div className="btn" onClick={() => fileRef.current.click()} style={{ background: t.accent, color: 'white', padding: 8, borderRadius: 6, textAlign: 'center', cursor: 'pointer' }}>+ Add photos</div>
        <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={onFiles} />
        {uploading > 0 && <div style={{ color: '#999', fontSize: 11 }}>uploading...</div>}
        {err && <div style={{ color: 'red' }}>{err}</div>}
        <div className="btn" onClick={autoFill} style={{ marginTop: 8, border: '1px solid ' + t.accent, color: t.accent, padding: 6, borderRadius: 6, textAlign: 'center', cursor: 'pointer' }}>✨ Auto-fill</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {library.map((ph, i) => (
            <img key={i} src={ph.url} draggable onDragStart={() => onDragStart(ph)} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, cursor: 'grab' }} />
          ))}
        </div>
      </div>

      {/* CENTER: canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ fontSize: 24, border: 'none', background: 'transparent', textAlign: 'center', fontFamily: t.font, width: 400 }} />
        <div style={{ display: 'flex', gap: 10, margin: '10px 0' }}>
          {LAYOUTS.map(l => (
            <div key={l} onClick={() => changeLayout(l)} style={{ padding: '4px 10px', borderRadius: 12, cursor: 'pointer', background: page && page.layout == l ? t.accent : '#e0e0e0', color: page && page.layout == l ? 'white' : '#333', fontSize: 12 }}>{l}</div>
          ))}
        </div>
        <div style={{ transform: 'scale(' + zoom + ')', transformOrigin: 'top center', transition: 'transform .2s' }}>
          {page ? (
            <div style={{ width: size == '8x8' ? 480 : size == '11x8.5' ? 620 : 420, height: size == '8x8' ? 480 : size == '11x8.5' ? 480 : 540, background: t.bg, color: t.fg, boxShadow: '0 4px 20px rgba(0,0,0,.15)', padding: 16, boxSizing: 'border-box', display: 'grid', gap: 8, gridTemplateColumns: page.layout == 'full' ? '1fr' : page.layout == 'collage' ? '1fr 1fr 1fr' : '1fr 1fr' }}>
              {Array.from({ length: slotsFor(page.layout) }).map((_, s) => (
                <div key={s} onDragOver={e => e.preventDefault()} onDrop={() => onDropSlot(s)} onClick={() => setSelectedSlot(s)} style={{ background: page.photos[s] ? 'none' : 'rgba(0,0,0,.06)', border: selectedSlot == s ? '2px solid ' + t.accent : '2px dashed rgba(0,0,0,.15)', borderRadius: 4, position: 'relative', overflow: 'hidden', minHeight: 100 }}>
                  {page.photos[s] ? (
                    <>
                      <img src={page.photos[s].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div onClick={() => removePhoto(s)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: 'white', borderRadius: 10, width: 20, height: 20, textAlign: 'center', lineHeight: '20px', cursor: 'pointer', fontSize: 12 }}>×</div>
                    </>
                  ) : (
                    <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center', color: 'rgba(0,0,0,.3)', fontSize: 12 }}>drop photo</div>
                  )}
                </div>
              ))}
            </div>
          ) : <div>no pages</div>}
          {page && <input placeholder="add a caption..." value={page.caption} onChange={e => setCaption(e.target.value)} style={{ width: '100%', marginTop: 8, border: 'none', background: 'transparent', textAlign: 'center', fontStyle: 'italic', fontFamily: t.font }} />}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <div onClick={() => setZoom(zoom - 0.1)} style={{ cursor: 'pointer', padding: 4 }}>➖</div>
          <div style={{ fontSize: 12 }}>{Math.round(zoom * 100)}%</div>
          <div onClick={() => setZoom(zoom + 0.1)} style={{ cursor: 'pointer', padding: 4 }}>➕</div>
          <div style={{ width: 20 }} />
          <div onClick={undo} style={{ cursor: 'pointer' }}>↩️</div>
          <div onClick={redo} style={{ cursor: 'pointer' }}>↪️</div>
        </div>
      </div>

      {/* RIGHT: pages + settings */}
      <div style={{ width: 240, borderLeft: '1px solid #ddd', padding: 12, overflow: 'auto', background: 'white' }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Theme</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.keys(THEMES).map(k => (
            <div key={k} onClick={() => setTheme(k)} title={k} style={{ width: 28, height: 28, borderRadius: 14, background: THEMES[k].bg, border: theme == k ? '3px solid ' + THEMES[k].accent : '1px solid #ccc', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ fontWeight: 'bold', margin: '12px 0 6px' }}>Size</div>
        <select value={size} onChange={e => setSize(e.target.value)} style={{ width: '100%' }}>
          {SIZES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ fontWeight: 'bold', margin: '12px 0 6px' }}>Cover</div>
        <select value={cover} onChange={e => setCover(e.target.value)} style={{ width: '100%' }}>
          <option value="soft">Softcover</option>
          <option value="hard">Hardcover</option>
          <option value="layflat">Layflat</option>
        </select>

        <div style={{ fontWeight: 'bold', margin: '16px 0 6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Pages ({pages.length * 2})</span>
          <span onClick={addPage} style={{ color: t.accent, cursor: 'pointer' }}>+ add</span>
        </div>
        {pages.map((p, i) => (
          <div key={p.id} onClick={() => setCurrent(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, marginBottom: 4, borderRadius: 4, background: i == current ? '#f0f0f0' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 30, background: '#ddd', borderRadius: 2, overflow: 'hidden' }}>
              {p.photos[0] && <img src={p.photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, fontSize: 12 }}>Spread {i + 1}</div>
            <span onClick={(e) => { e.stopPropagation(); movePage(i, i - 1) }} style={{ fontSize: 10 }}>▲</span>
            <span onClick={(e) => { e.stopPropagation(); movePage(i, i + 1) }} style={{ fontSize: 10 }}>▼</span>
            <span onClick={(e) => { e.stopPropagation(); deletePage(i) }} style={{ fontSize: 10, color: 'red' }}>✕</span>
          </div>
        ))}

        {showPrice && (
          <div style={{ marginTop: 16, padding: 10, background: '#fafafa', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: '#777' }}>Estimated price</div>
            <div style={{ fontSize: 22, fontWeight: 'bold' }}>${getPrice()}</div>
            <div onClick={() => setShowPrice(false)} style={{ fontSize: 10, color: '#aaa', cursor: 'pointer' }}>hide</div>
          </div>
        )}
        <div onClick={save} style={{ marginTop: 12, padding: 10, background: '#333', color: 'white', borderRadius: 6, textAlign: 'center', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</div>
        <div onClick={checkout} style={{ marginTop: 8, padding: 10, background: t.accent, color: 'white', borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>Order book →</div>
      </div>
    </div>
  )
}
