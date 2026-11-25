import { createFormatters } from '../format';
import type { Messages } from './en';

const { number: n, percent: pct, plural } = createFormatters('de');
const pages = (count: number) => plural(count, { one: `${n(count)} Seite`, other: `${n(count)} Seiten` });

export const de: Messages = {
  themes: {
    classic: 'Klassisch',
    modern: 'Modern',
    kraft: 'Kraft',
    pastel: 'Pastell',
  },
  settings: {
    heading: 'Bucheinstellungen',
    title: 'Titel',
    theme: 'Design',
    size: 'Format',
    cover: 'Einband',
  },
  tray: {
    heading: (count) => `Fotos (${n(count)})`,
    addPhotos: 'Fotos hinzufügen',
    replacement: 'Ersatzfoto',
    autoFill: 'Leere Felder automatisch füllen',
    empty: 'Füge Fotos hinzu, um dein Buch zu füllen.',
    library: 'Fotosammlung',
    selected: (photo) => `${photo} ausgewählt. Wähle ein Feld auf der Seite.`,
    missing: (name) => `${name} fehlt`,
    inBook: 'Im Buch',
    inBookLabel: (photo) => `${photo}, im Buch`,
    description: (name) => `Beschreibung von ${name}`,
    clearSelection: 'Auswahl aufheben',
    fallbackAlt: 'Foto',
  },
  uploads: {
    progress: (count) =>
      plural(count, {
        one: `${n(count)} Foto wird hochgeladen…`,
        other: `${n(count)} Fotos werden hochgeladen…`,
      }),
    problems: 'Probleme beim Hochladen',
    dismiss: 'Schließen',
    dismissLabel: (message) => `Schließen: ${message}`,
    errors: {
      'unsupported-type': (file) => `${file} ist kein unterstütztes Bildformat. Verwende JPEG, PNG, WebP oder GIF.`,
      'too-large': (file) => `${file} ist zu groß zum Hochladen.`,
      network: (file) => `${file} konnte nicht hochgeladen werden. Versuche es noch einmal.`,
      aborted: (file) => `Das Hochladen von ${file} wurde abgebrochen.`,
    },
  },
  order: {
    heading: 'Bestellübersicht',
    hidePrice: 'Preis ausblenden',
    showPrice: 'Preis anzeigen',
    priceDetails: 'Preisdetails',
    book: (count, format, cover) => `${pages(count)} · ${format} · ${cover}`,
    startsAt: (price, count) => `Bücher gibt es ab ${price} für ${pages(count)}.`,
    noPrice: 'Der Preis erscheint, sobald die Seitenzahl gedruckt werden kann.',
    total: 'Gesamt',
    base: (count) => `Buch mit ${pages(count)}`,
    extraPages: (count) =>
      plural(count, { one: `${n(count)} zusätzliche Seite`, other: `${n(count)} zusätzliche Seiten` }),
    coverUpgrade: (cover) => `Aufpreis ${cover}`,
    tooFewPages: (needed, minimum) =>
      `Füge ${plural(needed, { one: `${n(needed)} weitere Seite`, other: `${n(needed)} weitere Seiten` })} hinzu, um das Minimum von ${pages(minimum)} zu erreichen.`,
    tooManyPages: (maximum, over) => `Ein Buch hat höchstens ${pages(maximum)}. Entferne ${pages(over)}.`,
    unpriceable: () => 'Dieses Buch kann noch nicht gedruckt werden.',
    cantOrder: (issue) => `Du kannst noch nicht bestellen. ${issue}`,
    orderBook: 'Buch bestellen',
    emptySpreads: (count) =>
      plural(count, {
        one: `${n(count)} Doppelseite hat keine Fotos und wird leer gedruckt.`,
        other: `${n(count)} Doppelseiten haben keine Fotos und werden leer gedruckt.`,
      }),
    orderAnyway: 'Trotzdem bestellen',
    keepEditing: 'Weiter bearbeiten',
    ready: (book, price) => `Bereit zur Bestellung: ${book} · ${price}`,
  },
  common: {
    undo: 'Rückgängig',
    redo: 'Wiederholen',
  },
  layouts: {
    full: 'Ganze Seite',
    'two-up': 'Zwei Fotos',
    'three-grid': 'Dreier-Raster',
    'four-grid': 'Vierer-Raster',
    collage: 'Collage',
  },
  toolbar: {
    back: 'Zurück zu den Projekten',
    untitled: 'Unbenanntes Buch',
    language: 'Sprache',
    history: 'Verlauf',
    save: {
      saved: 'Alle Änderungen auf diesem Gerät gespeichert',
      pending: 'Wird gespeichert…',
      error: 'Speichern fehlgeschlagen. Gib Browserspeicher frei oder lass diesen Tab geöffnet.',
    },
  },
  canvas: {
    heading: (spread, count) => `Doppelseite ${n(spread)} von ${n(count)}`,
    layout: 'Layout',
    hint: 'Ziehe ein Foto auf ein Feld oder wähle links ein Foto aus und dann ein Feld.',
    hintSelected: (photo) => `Wähle ein Feld für ${photo}.`,
    placed: (photo, slot) => `${photo} in Feld ${n(slot)} eingefügt.`,
    caption: 'Bildunterschrift',
    captionPlaceholder: 'Bildunterschrift hinzufügen',
  },
  zoom: {
    label: 'Zoom',
    zoomOut: 'Verkleinern',
    zoomIn: 'Vergrößern',
    reset: 'Zoom zurücksetzen',
    value: (percent) => pct(percent),
  },
  slot: {
    empty: 'leer',
    missing: (name) => `${name} (fehlt)`,
    label: (slot, photo) => `Feld ${n(slot)}: ${photo}`,
    place: (photo, slot) => `${photo} in Feld ${n(slot)} einfügen`,
    photoMissing: 'Foto fehlt',
    dropHere: 'Foto hier ablegen',
    remove: (slot) => `Foto aus Feld ${n(slot)} entfernen`,
  },
  photos: {
    reAdd: 'Foto erneut hinzufügen',
    reAddLabel: (name) => `Foto ${name} erneut hinzufügen`,
  },
  spreads: {
    heading: 'Seiten',
    count: (spreads, printed) =>
      `${plural(spreads, { one: `${n(spreads)} Doppelseite`, other: `${n(spreads)} Doppelseiten` })} · ${plural(printed, { one: `${n(printed)} gedruckte Seite`, other: `${n(printed)} gedruckte Seiten` })}`,
    name: (spread) => `Doppelseite ${n(spread)}`,
    pages: (first, last) => `Seiten ${n(first)}–${n(last)}`,
    selectLabel: (spread, first, last) => `Doppelseite ${n(spread)}, Seiten ${n(first)}–${n(last)}`,
    moveUp: (spread) => `Doppelseite ${n(spread)} nach oben verschieben`,
    moveDown: (spread) => `Doppelseite ${n(spread)} nach unten verschieben`,
    delete: (spread) => `Doppelseite ${n(spread)} löschen`,
    deleted: (spread) => `Doppelseite ${n(spread)} gelöscht.`,
    add: 'Doppelseite hinzufügen',
  },
  formats: {
    'square-8': '8 × 8 Zoll, quadratisch',
    'landscape-11': '11 × 8,5 Zoll, Querformat',
    'portrait-8x11': '8,5 × 11 Zoll, Hochformat',
  },
  covers: {
    softcover: 'Softcover',
    hardcover: 'Hardcover',
    layflat: 'Layflat',
  },
  projects: {
    heading: 'Deine Fotobücher',
    listLabel: 'Projekte',
    pageCount: pages,
    open: (title) => `${title} öffnen`,
    edited: (date) => `Bearbeitet am ${date}`,
  },
};
