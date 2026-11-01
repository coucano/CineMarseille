# Ciné Marseille

Les séances de cinéma de la semaine à Marseille et Aix-en-Provence (source : AlloCiné), avec les films
de ta watchlist Letterboxd mis en évidence, un filtre VO / VF et un filtre par carte illimitée
(UGC Illimité, CinéPass Pathé).

Le site : https://cine-marseille.vercel.app/

Adapté de [cine-rio](https://github.com/coucano/cine-rio).

- `scripts/scrape.py` récupère les séances des cinémas listés par AlloCiné pour Marseille et Aix
  (identifiants de ville dans `CITIES`) et écrit `site/data/showtimes.json`.
  Il lit aussi, sur la page tarifs AlloCiné de chaque cinéma, les cartes illimitées acceptées
  (rubrique « Cartes acceptées »).
  Il tourne chaque nuit grâce à GitHub Actions (`.github/workflows/refresh.yml`).
- `site/index.html` est la page du site.
- `api/watchlist.js` renvoie la watchlist d'un pseudo Letterboxd. Elle est lue sur Letterboxd
  la première fois, puis gardée dans une base Redis Upstash (branchée depuis Vercel, onglet Storage).
  Le bouton « Synchroniser » la met à jour au plus une fois toutes les 10 minutes par pseudo, et le
  site ne fait jamais plus de 20 synchros à la demande par minute au total.
- `api/_sync.js` : la synchro ne relit d'habitude que les premières pages (derniers ajouts) jusqu'à
  retrouver un film connu, et relit la watchlist en entier une fois par semaine.
- Films vus : la même synchro garde aussi la liste des films vus du pseudo (seulement leurs
  identifiants Letterboxd, environ 20 octets par film). Elle est relue en entier une fois par mois
  (pages `/films/`, 72 films par page, trois pages à la fois), et complétée chaque jour par le flux
  RSS du journal (une seule requête). Letterboxd bloque souvent (Cloudflare) les pages 2 et
  suivantes : on garde alors la première page (les 72 films les plus récents, ceux qui passent
  en salle) et on retente la relecture complète au bout d'une semaine. Sur le site, les films vus passent en bas de la liste (case
  « Films vus en bas »), et le bouton « Vu ? » de chaque film permet de corriger à la main
  (gardé dans le navigateur).
- `api/cron-sync.js` tourne chaque nuit (Vercel Cron) : il resynchronise les watchlists qui ne
  l'ont pas été depuis 20 h et oublie les pseudos absents depuis six mois.
