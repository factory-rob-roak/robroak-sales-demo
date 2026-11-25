import { createFormatters } from '../format';
import type { Messages } from './en';

const { number: n, percent: pct, plural } = createFormatters('fr');
const pages = (count: number) => plural(count, { one: `${n(count)} page`, other: `${n(count)} pages` });
// French typography puts a no-break space before a colon.
const colon = '\u00a0:';

export const fr: Messages = {
  themes: {
    classic: 'Classique',
    modern: 'Moderne',
    kraft: 'Kraft',
    pastel: 'Pastel',
  },
  settings: {
    heading: 'Paramètres du livre',
    title: 'Titre',
    theme: 'Thème',
    size: 'Format',
    cover: 'Couverture',
  },
  tray: {
    heading: (count) => `Photos (${n(count)})`,
    addPhotos: 'Ajouter des photos',
    replacement: 'Photo de remplacement',
    autoFill: 'Remplir les emplacements vides',
    empty: 'Ajoutez des photos pour commencer à remplir votre livre.',
    library: 'Photothèque',
    selected: (photo) => `Photo sélectionnée${colon} ${photo}. Choisissez un emplacement sur la page.`,
    missing: (name) => `${name} est introuvable`,
    inBook: 'Dans le livre',
    inBookLabel: (photo) => `${photo}, dans le livre`,
    description: (name) => `Description de ${name}`,
    clearSelection: 'Annuler la sélection',
    fallbackAlt: 'Photo',
  },
  uploads: {
    progress: (count) =>
      plural(count, {
        one: `Importation de ${n(count)} photo…`,
        other: `Importation de ${n(count)} photos…`,
      }),
    problems: 'Problèmes d’importation',
    dismiss: 'Fermer',
    dismissLabel: (message) => `Fermer${colon} ${message}`,
    errors: {
      'unsupported-type': (file) =>
        `${file} n’est pas une image prise en charge. Utilisez JPEG, PNG, WebP ou GIF.`,
      'too-large': (file) => `${file} est trop volumineux pour être importé.`,
      network: (file) => `Impossible d’importer ${file}. Réessayez.`,
      aborted: (file) => `L’importation de ${file} a été annulée.`,
    },
  },
  order: {
    heading: 'Récapitulatif de la commande',
    hidePrice: 'Masquer le prix',
    showPrice: 'Afficher le prix',
    priceDetails: 'Détail du prix',
    book: (count, format, cover) => `${pages(count)} · ${format} · ${cover}`,
    startsAt: (price, count) => `À partir de ${price} pour un livre de ${pages(count)}.`,
    noPrice: 'Le prix s’affiche dès que le nombre de pages permet l’impression.',
    total: 'Total',
    base: (count) => `Livre de ${pages(count)}`,
    extraPages: (count) =>
      plural(count, {
        one: `${n(count)} page supplémentaire`,
        other: `${n(count)} pages supplémentaires`,
      }),
    coverUpgrade: (cover) => `Supplément${colon} ${cover}`,
    tooFewPages: (needed, minimum) =>
      `Ajoutez ${pages(needed)} pour atteindre le minimum de ${pages(minimum)}.`,
    tooManyPages: (maximum, over) =>
      `Un livre compte au maximum ${pages(maximum)}. Supprimez ${pages(over)}.`,
    unpriceable: () => 'Ce livre ne peut pas encore être imprimé.',
    cantOrder: (issue) => `Vous ne pouvez pas encore commander. ${issue}`,
    orderBook: 'Commander le livre',
    emptySpreads: (count) =>
      plural(count, {
        one: `${n(count)} double page ne contient aucune photo et sera imprimée vide.`,
        other: `${n(count)} doubles pages ne contiennent aucune photo et seront imprimées vides.`,
      }),
    orderAnyway: 'Commander quand même',
    keepEditing: 'Continuer à modifier',
    ready: (book, price) => `Prêt à commander${colon} ${book} · ${price}`,
  },
  common: {
    undo: 'Annuler',
    redo: 'Rétablir',
  },
  layouts: {
    full: 'Pleine page',
    'two-up': 'Deux photos',
    'three-grid': 'Grille de trois',
    'four-grid': 'Grille de quatre',
    collage: 'Collage',
  },
  toolbar: {
    back: 'Retour aux projets',
    untitled: 'Livre sans titre',
    language: 'Langue',
    history: 'Historique',
    save: {
      saved: 'Toutes les modifications sont enregistrées sur cet appareil',
      pending: 'Enregistrement…',
      error:
        'Échec de l’enregistrement. Libérez de l’espace de stockage dans le navigateur ou gardez cet onglet ouvert.',
    },
  },
  canvas: {
    heading: (spread, count) => `Double page ${n(spread)} sur ${n(count)}`,
    layout: 'Mise en page',
    hint: 'Faites glisser une photo sur un emplacement, ou sélectionnez une photo dans la liste puis choisissez un emplacement.',
    hintSelected: (photo) => `Choisissez un emplacement pour ${photo}.`,
    placed: (photo, slot) => `Photo placée dans l’emplacement ${n(slot)}${colon} ${photo}.`,
    caption: 'Légende',
    captionPlaceholder: 'Ajouter une légende',
  },
  zoom: {
    label: 'Zoom',
    zoomOut: 'Zoom arrière',
    zoomIn: 'Zoom avant',
    reset: 'Réinitialiser le zoom',
    value: (percent) => pct(percent),
  },
  slot: {
    empty: 'vide',
    missing: (name) => `${name} (introuvable)`,
    label: (slot, photo) => `Emplacement ${n(slot)}${colon} ${photo}`,
    place: (photo, slot) => `Placer ${photo} dans l’emplacement ${n(slot)}`,
    photoMissing: 'Photo introuvable',
    dropHere: 'Déposez une photo ici',
    remove: (slot) => `Retirer la photo de l’emplacement ${n(slot)}`,
  },
  photos: {
    reAdd: 'Ajouter à nouveau la photo',
    reAddLabel: (name) => `Ajouter à nouveau la photo ${name}`,
  },
  spreads: {
    heading: 'Pages',
    count: (spreads, printed) =>
      `${plural(spreads, { one: `${n(spreads)} double page`, other: `${n(spreads)} doubles pages` })} · ${plural(printed, { one: `${n(printed)} page imprimée`, other: `${n(printed)} pages imprimées` })}`,
    name: (spread) => `Double page ${n(spread)}`,
    pages: (first, last) => `Pages ${n(first)}–${n(last)}`,
    selectLabel: (spread, first, last) => `Double page ${n(spread)}, pages ${n(first)}–${n(last)}`,
    moveUp: (spread) => `Monter la double page ${n(spread)}`,
    moveDown: (spread) => `Descendre la double page ${n(spread)}`,
    delete: (spread) => `Supprimer la double page ${n(spread)}`,
    deleted: (spread) => `Double page ${n(spread)} supprimée.`,
    add: 'Ajouter une double page',
  },
  formats: {
    'square-8': 'Carré 8 × 8 po',
    'landscape-11': 'Paysage 11 × 8,5 po',
    'portrait-8x11': 'Portrait 8,5 × 11 po',
  },
  covers: {
    softcover: 'Couverture souple',
    hardcover: 'Couverture rigide',
    layflat: 'Ouverture à plat',
  },
  projects: {
    heading: 'Vos livres photo',
    listLabel: 'Projets',
    pageCount: pages,
    open: (title) => `Ouvrir ${title}`,
    edited: (date) => `Modifié le ${date}`,
  },
};
