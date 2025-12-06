# Guide de Maintenance des Dates

## Ajouter un Nouvel Événement

### Méthode 1 : Statique (Fichier)

Éditer `src/data/events.js` et ajouter une ligne dans le tableau `allEvents` :

```javascript
export const allEvents = [
  // Événements futurs
  { date: "31 Août 25", event: "Hadra Trance Festival", genre: "Hi-Tech Live" },
  { date: "20 Sept 25", event: "Out of the Void Festival", genre: "Acid / Mental" },
  // ✅ AJOUTER ICI
  { date: "15 Oct 25", event: "Mon Nouvel Événement", genre: "Psytrance" },

  // Événements passés
  { date: "13 Juil 25", event: "ADN Music Festival", genre: "Closing Mashup" },
  // ...
];
```

**Format de Date :**
- `"DD Mois AA"` → `"15 Oct 25"` (recommandé, année à 2 chiffres)
- `"DD Mois"` → `"15 Oct"` (année par défaut = année actuelle)
- Les mois doivent correspondre aux clés dans `moisFrancais`

**Mois Supportés :**
```
'janv', 'janvier'    → 0
'févr', 'février'    → 1
'mars'               → 2
'avr', 'avril'       → 3
'mai'                → 4
'juin'               → 5
'juil', 'juillet'    → 6
'août'               → 7
'sept', 'septembre'  → 8
'oct', 'octobre'     → 9
'nov', 'novembre'    → 10
'déc', 'décembre'    → 11
```

### Méthode 2 : Dynamique (Supabase - Recommandé pour la Production)

```sql
INSERT INTO events (event_date, event_name, genre)
VALUES
  ('2025-10-15', 'Mon Nouvel Événement', 'Psytrance');
```

Puis adapter le code React pour récupérer depuis Supabase.

## Format Correct des Données

### ✅ Bon Format
```javascript
{
  date: "31 Août 25",      // Format: DD Mois AA
  event: "Festival Name",  // Nom lisible
  genre: "Psytrance"       // Style/Genre
}
```

### ❌ Mauvais Formats
```javascript
// ❌ Format ambigu
{ date: "31/08/25", ... }

// ❌ Date invalide
{ date: "31 InvalidMonth 25", ... }

// ❌ Année à 4 chiffres (fonctionne mais non cohérent)
{ date: "31 Août 2025", ... }

// ❌ Mois en anglais
{ date: "31 August 25", ... }
```

## Test des Dates

### Vérifier qu'un Événement s'Affiche Correctement

1. **Ouvrir la console développeur** (F12)

2. **Tester le parsing :**
```javascript
import { parseEventDate, isDateInFuture } from './src/utils/dateUtils.js';

const testDate = parseEventDate("31 Août 25");
console.log(testDate);  // Doit afficher une Date valide

console.log(isDateInFuture(testDate));  // true ou false selon la date
```

3. **Tester le filtrage :**
```javascript
import { getUpcomingDates, getPastDates } from './src/utils/dateUtils.js';
import { allEvents } from './src/data/events.js';

console.log(getUpcomingDates(allEvents));  // Dates futures
console.log(getPastDates(allEvents));      // Dates passées
```

## Comprendre le Tri Automatique

### Événements Futurs (Prochaines Dates)
Triés du **plus proche** au **plus lointain** :
```
Aujourd'hui (jour 0)
Demain (jour 1)
Dans 3 jours
Dans 7 jours
...
```

### Événements Passés (Archives)
Triés du **plus récent** au **plus ancien** :
```
Hier
Il y a 3 jours
Il y a 1 mois
Il y a 1 an
...
```

## Dépannage

### Problème: L'événement n'apparaît pas en "Prochaines Dates"

**Causes possibles :**
1. La date est au passé
2. Le format de date est incorrect
3. Le nom du mois est mal orthographié

**Solution :**
```javascript
// Vérifier dans la console
parseEventDate("31 Août 25");  // Doit retourner une Date valide
isDateInFuture(parseEventDate("31 Août 25"));  // Doit retourner true
```

### Problème: L'événement apparaît dans les Archives au lieu des Prochaines Dates

**Cause :** La date est interprétée comme du passé.

**Vérifier :**
```javascript
const date = parseEventDate("31 Août 25");
console.log(date);  // Voir quelle année est utilisée
console.log(new Date());  // Voir la date actuelle

// Si la date interprétée < date actuelle, elle ira en archives
```

### Problème: Le parsing échoue silencieusement

**Symptôme :** L'événement disparaît du site.

**Diagnostic :**
```javascript
parseEventDate("31 Août 25");  // Retourne null si erreur

// Vérifier les erreurs de typage
parseEventDate("31 Aout 25");   // ❌ Pas d'accent sur 'ù'
parseEventDate("31 AOÛT 25");   // ✅ Fonctionne (convertit en minuscules)
```

## Formules Utiles

### Obtenir la Date d'Aujourd'hui
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
console.log(today.toLocaleDateString('fr-FR'));  // "6/12/2024"
```

### Convertir une Date en Texte Affichable
```javascript
const date = parseEventDate("31 Août 25");
const formatted = date.toLocaleDateString('fr-FR', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});
console.log(formatted);  // "jeu. 31 août"
```

### Calculer les Jours jusqu'à un Événement
```javascript
import { daysUntilEvent } from './src/utils/dateUtils.js';

const days = daysUntilEvent("31 Août 25");
console.log(`Événement dans ${days} jours`);
```

## Personnalisations Possibles

### Changer le Format d'Affichage des Dates

Dans `src/utils/dateUtils.js`, modifier `formatDateDisplay()` :
```javascript
export const formatDateDisplay = (dateStr) => {
  const date = parseEventDate(dateStr);
  if (!date) return dateStr;

  // Actuellement: "jeu. 31 août"
  // Vous pouvez le changer à:
  const options = {
    weekday: 'long',      // 'jeudi' au lieu de 'jeu.'
    month: 'long',        // 'août' au lieu de 'août'
    day: 'numeric'        // '31'
  };
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
};
```

### Modifier les Étiquettes d'Urgence

Dans `src/utils/dateUtils.js`, modifier `getEventUrgencyLabel()` :
```javascript
export const getEventUrgencyLabel = (dateStr) => {
  const days = daysUntilEvent(dateStr);

  if (days < 0) return null;
  if (days === 0) return 'AUJOURD\'HUI';      // Modifier
  if (days === 1) return 'DEMAIN';            // Modifier
  if (days <= 7) return `${days}j restants`;  // Modifier

  return null;
};
```

### Changer les Couleurs des Dates

Dans `src/App.jsx`, modifier les classes Tailwind :
```javascript
// Ligne 111 (avant modification)
className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-accent-primary/20 ..."

// Changer en (exemple)
className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30 ..."
```

## Migration vers Supabase

Pour migrer les données statiques vers Supabase :

### 1. Créer la table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  genre TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_event_date ON events(event_date);
```

### 2. Importer les données
```sql
INSERT INTO events (event_date, event_name, genre) VALUES
  ('2025-08-31', 'Hadra Trance Festival', 'Hi-Tech Live'),
  ('2025-09-20', 'Out of the Void Festival', 'Acid / Mental'),
  -- ... autres événements
;
```

### 3. Adapter le code React
```javascript
// Créer src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Adapter src/utils/dateUtils.js
export const getUpcomingDates = async () => {
  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });

  return data.map(event => ({
    date: new Date(event.event_date).toLocaleDateString('fr-FR'),
    event: event.event_name,
    genre: event.genre
  }));
};
```

## Version Actuelle

- **Dernière mise à jour :** 2024
- **Format de dates :** Français (DD Mois AA)
- **Nombre d'événements :** 50+
- **Tri automatique :** Activé
- **Étiquettes d'urgence :** Activées

## Contactez pour Aide

Pour des questions ou des modifications complexes, consultez le fichier `IMPLEMENTATION_NOTES.md`.
