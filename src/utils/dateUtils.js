/**
 * Utilitaires pour la gestion des dates
 * Gère le parsing, le filtrage et le tri des événements musicaux
 */

/**
 * Parse une date au format "DD Mois AA" en objet Date
 * @param {string} dateStr - Date au format "31 Août 25" ou "31 Août"
 * @returns {Date} Objet Date correspondant
 */
export const parseEventDate = (dateStr) => {
  // Mapping des mois français en nombres
  const moisFrancais = {
    'janv': 0, 'janvier': 0,
    'févr': 1, 'février': 1,
    'mars': 2,
    'avr': 3, 'avril': 3,
    'mai': 4,
    'juin': 5,
    'juil': 6, 'juillet': 6,
    'août': 7,
    'sept': 8, 'septembre': 8,
    'oct': 9, 'octobre': 9,
    'nov': 10, 'novembre': 10,
    'déc': 11, 'décembre': 11
  };

  // Nettoyer et normaliser la chaîne
  const normalized = dateStr.toLowerCase().trim();
  const parts = normalized.split(/\s+/);

  if (parts.length < 2) return null;

  const jour = parseInt(parts[0], 10);
  const mois = moisFrancais[parts[1]];
  let annee = new Date().getFullYear(); // Année par défaut: actuelle

  // Si une année est fournie, l'utiliser
  if (parts.length >= 3) {
    const anneeStr = parts[2];
    if (anneeStr.length === 2) {
      annee = 2000 + parseInt(anneeStr, 10);
    } else if (anneeStr.length === 4) {
      annee = parseInt(anneeStr, 10);
    }
  }

  if (isNaN(jour) || mois === undefined) return null;

  return new Date(annee, mois, jour, 0, 0, 0, 0);
};

/**
 * Vérifie si une date est dans le futur
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si la date est dans le futur
 */
export const isDateInFuture = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Formate une date pour affichage lisible
 * @param {string} dateStr - Date au format "31 Août 25"
 * @returns {string} Date formatée
 */
export const formatDateDisplay = (dateStr) => {
  const date = parseEventDate(dateStr);
  if (!date) return dateStr;

  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
};

/**
 * Trie les dates en ordre chronologique
 * @param {Array} dates - Tableau d'objets avec propriété 'date' (string)
 * @returns {Array} Dates triées
 */
export const sortDatesChrono = (dates) => {
  return [...dates].sort((a, b) => {
    const dateA = parseEventDate(a.date);
    const dateB = parseEventDate(b.date);
    return dateA - dateB;
  });
};

/**
 * Filtre et trie les dates futures
 * @param {Array} allDates - Tous les événements
 * @returns {Array} Événements futurs triés
 */
export const getUpcomingDates = (allDates) => {
  return sortDatesChrono(
    allDates.filter(event => isDateInFuture(parseEventDate(event.date)))
  );
};

/**
 * Filtre et trie les dates passées
 * @param {Array} allDates - Tous les événements
 * @returns {Array} Événements passés triés (du plus récent au plus ancien)
 */
export const getPastDates = (allDates) => {
  const past = allDates.filter(event => !isDateInFuture(parseEventDate(event.date)));
  return past.sort((a, b) => {
    const dateA = parseEventDate(a.date);
    const dateB = parseEventDate(b.date);
    return dateB - dateA; // Inverser pour du plus récent au plus ancien
  });
};

/**
 * Compte les jours jusqu'à un événement
 * @param {string} dateStr - Date au format "31 Août 25"
 * @returns {number} Nombre de jours jusqu'à la date (-1 si passé)
 */
export const daysUntilEvent = (dateStr) => {
  const date = parseEventDate(dateStr);
  if (!date) return -1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Crée un label pour l'urgence d'un événement
 * @param {string} dateStr - Date au format "31 Août 25"
 * @returns {string|null} Label d'urgence ou null
 */
export const getEventUrgencyLabel = (dateStr) => {
  const days = daysUntilEvent(dateStr);

  if (days < 0) return null; // Passé
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Demain';
  if (days <= 7) return `Dans ${days}j`;
  if (days <= 30) return `Dans ${Math.ceil(days / 7)}sem`;

  return null;
};
