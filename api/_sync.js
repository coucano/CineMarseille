// Synchronise la watchlist d'un pseudo : par petits bouts d'habitude,
// en entier la première fois puis une fois par semaine (pour voir les films retirés).
// Films vus : relus en entier une fois par mois seulement (c'est la liste la plus longue),
// et complétés entre-temps par les dernières entrées du journal (flux RSS, une seule requête).

const { getWatchlist, getNewEntries, getWatched, getRecentlyWatched } = require("./_letterboxd");
const store = require("./_store");

const FULL_EVERY = 7 * 864e5;
const SEEN_FULL_EVERY = 30 * 864e5;

// Renvoie toujours { seen, seenFull } : en cas d'erreur, on garde les films vus déjà connus
async function syncWatched(user, rec) {
  const old = (rec && rec.seen) || [];
  try {
    if (rec && rec.seen && rec.seen.length && rec.seenFull && Date.now() - rec.seenFull < SEEN_FULL_EVERY) {
      const recent = await getRecentlyWatched(user);
      return { seen: [...new Set(recent.concat(old))], seenFull: rec.seenFull };
    }
    return { seen: (await getWatched(user)) || [], seenFull: Date.now() };
  } catch (e) {
    console.log(`films vus de ${user} : ${e.message}`);
    return { seen: old, seenFull: (rec && rec.seenFull) || 0 };
  }
}

async function syncUser(user, rec) {
  // films vus et watchlist sont lus en même temps
  const watched = syncWatched(user, rec);
  let films, full = false;
  if (rec && rec.full && Date.now() - rec.full < FULL_EVERY) {
    films = await getNewEntries(user, rec.films);
  }
  if (films === undefined) {
    films = await getWatchlist(user);
    full = true;
  }
  const { seen, seenFull } = await watched;
  if (films === null) return null;
  return store.save(user, { films, full: full ? Date.now() : rec.full, seen, seenFull });
}

module.exports = { syncUser };
