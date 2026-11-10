# Landing page — Nous Avons Des Elles

Page d'accueil statique (HTML/CSS/JS, sans framework), en **français et en anglais**, de l'association **Nous Avons Des Elles** : l'association, ses valeurs, ses publics, la galerie photo, et deux cartes qui renvoient vers les sites de ses projets, **Station-Cœur** (`https://www.nousavonsdeselles.fr/station-coeur/`) et **Les Précieuses** (`https://nousavonsdeselles.fr/les-precieuses/`). Les textes sont ceux de la page d’accueil actuelle (https://www.nousavonsdeselles.fr), sans contenu repris des deux sites de projets.

Elle est faite pour devenir la **page d'accueil du site WordPress existant** (`https://www.nousavonsdeselles.fr`), hébergé chez **OVHcloud** (hébergement web mutualisé). Le reste du site (pages `/station-coeur/`, `/les-precieuses/`, mentions légales, etc.) reste géré par WordPress.

Le déploiement décrit ici se fait **entièrement depuis l'espace client OVH**, dans un navigateur : pas de logiciel FTP, pas de SSH, pas de ligne de commande.

---

## Sommaire

1. [Contenu du projet](#1-contenu-du-projet)
2. [Prérequis](#2-prérequis)
3. [Travailler en local](#3-travailler-en-local)
4. [Déploiement via l'espace client OVH](#4-déploiement-via-lespace-client-ovh)
5. [Favicons](#5-favicons)
6. [SEO : robots.txt et sitemap.xml](#6-seo--robotstxt-et-sitemapxml)
7. [Mettre à jour la landing page](#7-mettre-à-jour-la-landing-page)
8. [Liste de vérification après mise en ligne](#8-liste-de-vérification-après-mise-en-ligne)
9. [Dépannage](#9-dépannage)
10. [Revenir en arrière](#10-revenir-en-arrière)

---

## 1. Contenu du projet

```
nousavonsdeselles/
├── public/                  ← LE LIVRABLE : tout ce qui part sur l'hébergement OVH
│   ├── index.html           ← la landing page, textes en français
│   ├── styles.css
│   ├── i18n.js              ← traductions anglaises + bouton FR/EN
│   ├── site.js              ← menu, onglets, carrousel et galerie minutés
│   ├── images/
│   │   ├── logo/            ← logos de l'association, de Station-Cœur et des Précieuses
│   │   ├── galerie/         ← photos de la boutique solidaire (800 et 1600 px)
│   │   ├── lesprecieuses/   ← photos optimisées (large / medium / thumb)
│   │   └── station-coeur/
│   ├── favicon.ico, favicon.svg, favicon-*.png, apple-touch-icon.png, …
│   ├── site.webmanifest
│   ├── robots.txt
│   └── sitemap.xml
├── wordpress-favicons/      ← kit de favicons prêt à téléverser dans WordPress
├── scripts/
│   ├── convert-images.mjs   ← conversion des photos en WebP multi-tailles
│   ├── build-split-images.mjs← collages « split » des trois galeries (public/images/splits/)
│   └── generate-favicons.mjs← génération du logo et des favicons
├── src/logo-source.png      ← logo source (haute définition, fond transparent)
└── package.json
```

> **Bon à savoir :** `index.html` utilise uniquement des **chemins relatifs** (`styles.css`, `i18n.js`, `site.js`, `images/...`, `favicon.svg`). Les fichiers doivent donc garder la même arborescence que dans `public/` une fois sur l'hébergement.

## 2. Prérequis

| Pour… | Il faut |
|---|---|
| Modifier et prévisualiser la page | [Node.js](https://nodejs.org/) 18 ou plus récent |
| Déployer | Un accès à l'**espace client OVHcloud** ([www.ovh.com/manager](https://www.ovh.com/manager/)) avec les droits sur l'hébergement web du site |
| Se connecter à l'Explorateur FTP | L'**identifiant FTP** de l'hébergement et son **mot de passe** (il peut être réinitialisé depuis l'espace client, voir étape 2) |
| Dans tous les cas | Une **sauvegarde** du site avant toute modification (voir étape 1) |

## 3. Travailler en local

```bash
npm install          # installe sharp (traitement d'images)
npm run dev          # sert public/ sur http://localhost:3000
```

Scripts disponibles :

| Commande | Rôle |
|---|---|
| `npm run dev` | Prévisualise `public/` dans le navigateur |
| `npm run convert-images` | Convertit les photos de `../img/` en WebP (3 tailles) vers `public/images/` |
| `npm run split-images` | Recompose les collages des galeries (accueil : 8, Les Précieuses en entreprise : 4, galerie photo : 11) à partir des photos de `public/images/` vers `public/images/splits/`. Pour un seul jeu : `npm run split-images -- galerie` |
| `npm run favicons` | Régénère logo + favicons depuis `src/logo-source.png` vers `public/` **et** `wordpress-favicons/` |
| `npm run build` | Alias de `convert-images` |

> Les photos sources ne sont **pas** dans ce dépôt : `convert-images` les lit dans le dossier voisin `../img/lesprecieuses/` et `../img/station-coeur/`. Les images déjà optimisées de `public/images/` sont, elles, versionnées.

---

## 4. Déploiement via l'espace client OVH

**Principe :** on dépose les fichiers de la landing page à côté de WordPress, dans le dossier racine du site, puis on ajoute une ligne au fichier `.htaccess` pour que le serveur serve `index.html` en priorité sur l'URL `/`. Toutes les autres URL (`/station-coeur/`, `/wp-admin/`, etc.) continuent d'être traitées par WordPress.

Les hébergements mutualisés OVH utilisent Apache : le `.htaccess` est pris en compte immédiatement, sans redémarrage.

### Étape 0 — Repérer le dossier racine du site

1. Connectez-vous à l'[espace client OVHcloud](https://www.ovh.com/manager/).
2. **Web Cloud** → **Hébergements** → sélectionnez l'hébergement du site.
3. Onglet **Multisite** : sur la ligne `www.nousavonsdeselles.fr`, notez la colonne **Dossier racine** (en général `www`).

C'est ce dossier qui contient déjà `wp-config.php`, `index.php`, `wp-admin/`, `wp-content/`… Dans la suite, il est appelé « dossier racine ».

### Étape 1 — Sauvegarder

L'hébergement OVH conserve des sauvegardes automatiques, mais faites quand même une copie juste avant l'intervention :

- **Base de données :** onglet **Bases de données** → bouton `…` sur la base de WordPress → **Créer une sauvegarde** (à faire par précaution, même si la landing ne touche pas à la base).
- **`.htaccess` :** une fois dans l'Explorateur FTP (étape 2), ouvrez le `.htaccess` du dossier racine et copiez son contenu dans un fichier texte sur votre ordinateur. C'est votre filet de sécurité.

> En dernier recours, l'onglet **FTP-SSH** → **Restaurer une sauvegarde** permet de remettre tous les fichiers de l'hébergement dans l'état d'un jour précédent.

### Étape 2 — Ouvrir l'Explorateur FTP

1. Onglet **FTP-SSH** de l'hébergement.
2. Si vous ne connaissez pas le mot de passe FTP : dans le tableau des utilisateurs, bouton `…` sur l'utilisateur principal → **Modifier le mot de passe**. La prise en compte prend quelques minutes.
3. Cliquez sur **Explorateur FTP**. Un nouvel onglet s'ouvre : le serveur est déjà rempli, saisissez l'**identifiant FTP** (affiché dans l'onglet FTP-SSH) et le mot de passe, puis connectez-vous.
4. Entrez dans le dossier racine noté à l'étape 0 (par exemple `www`).

### Étape 3 — Vérifier qu'il n'y a pas de conflit de noms

Dans le dossier racine, vérifiez qu'il n'existe **pas déjà** :

- un dossier `images/` ;
- un fichier `styles.css`, `i18n.js` ou `site.js` ;
- un fichier `index.html`.

Si l'un d'eux existe, **ne l'écrasez pas** : renommez l'élément côté landing (et mettez à jour les chemins dans `index.html`) avant de continuer.

### Étape 4 — Préparer une archive ZIP

Sur votre ordinateur, ouvrez le dossier `public/` du projet, puis :

1. Sélectionnez **son contenu** (`index.html`, `styles.css`, `i18n.js`, `site.js`, `images/`, les favicons, `site.webmanifest`…), **pas** le dossier `public/` lui-même.
2. **Ne sélectionnez pas** `robots.txt` ni `sitemap.xml` si une extension SEO est installée sur WordPress (voir [section 6](#6-seo--robotstxt-et-sitemapxml)).
3. Clic droit → **Compresser dans un fichier ZIP** (Windows 11) ou **Envoyer vers → Dossier compressé**. Nommez-le par exemple `landing.zip`.

> Si vous zippez le dossier `public/` au lieu de son contenu, les fichiers se retrouveront dans `www/public/` et la page ne s'affichera pas sur `/`.

### Étape 5 — Téléverser et décompresser

1. Dans l'Explorateur FTP, assurez-vous d'être **dans le dossier racine** (`www`).
2. Cliquez sur **Upload** (Envoyer).
3. Dans la zone **Archives** (et non *Fichiers*), sélectionnez `landing.zip`, puis validez : l'archive est envoyée **et décompressée automatiquement** dans le dossier courant.
4. Revenez à la liste : `index.html`, `styles.css`, `i18n.js`, `site.js`, `images/`, les favicons, etc. doivent apparaître **à côté** de `index.php` et `wp-config.php`.

```
www/                         ← dossier racine (contient déjà wp-config.php)
├── index.php                ← WordPress (NE PAS supprimer)
├── index.html               ← nouveau
├── styles.css, i18n.js, site.js  ← nouveaux
├── images/                  ← nouveau
├── favicon.ico, favicon.svg, favicon-*.png, apple-touch-icon.png, …  ← nouveaux
├── site.webmanifest         ← nouveau
├── wp-admin/  wp-content/  wp-includes/  …
└── .htaccess
```

> Si la décompression échoue, téléversez les fichiers via la zone **Fichiers** : d'abord les fichiers à plat, puis créez le dossier `images/` (bouton **New dir**) et ses sous-dossiers, et envoyez les images dans chacun d'eux.

### Étape 6 — Donner la priorité à `index.html` dans le `.htaccess`

1. Dans le dossier racine, cochez le fichier `.htaccess` puis cliquez sur **Edit** (Modifier).
2. Ajoutez ces deux lignes **tout en haut**, **au-dessus** du bloc `# BEGIN WordPress` :

   ```apache
   # Landing page statique servie sur la page d'accueil
   DirectoryIndex index.html index.php
   ```

3. Enregistrez (**Save**).

Le fichier doit ressembler à ceci (le bloc WordPress peut légèrement différer, c'est normal) :

```apache
# Landing page statique servie sur la page d'accueil
DirectoryIndex index.html index.php

# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
```

> Ne modifiez jamais l'intérieur du bloc `# BEGIN WordPress … # END WordPress` : WordPress le réécrit lorsque vous enregistrez les permaliens.
>
> Si une autre ligne `DirectoryIndex` existe déjà dans le fichier, remplacez-la par celle-ci au lieu d'en ajouter une seconde.

### Étape 7 — Vider les caches

- **CDN OVH** (si l'option est active) : onglet **Multisite** → bouton `…` sur la ligne du domaine → **Vider le cache**.
- **Extension de cache WordPress** (WP Rocket, LiteSpeed Cache, W3 Total Cache, WP Super Cache…) : depuis `/wp-admin/`, **Vider tout le cache**.
- **Navigateur :** `Ctrl + F5`, ou testez en fenêtre de navigation privée.

✅ Ouvrez `https://www.nousavonsdeselles.fr/` : la landing page doit s'afficher, et les liens « Station-Cœur » / « Les Précieuses » doivent mener aux pages WordPress.

### Étape 8 — Ancienne page d'accueil WordPress

La page d'accueil WordPress d'origine reste accessible via `https://www.nousavonsdeselles.fr/index.php`. Pour éviter tout contenu dupliqué, vous pouvez dans **Réglages → Lecture** de WordPress choisir une page statique simple comme page d'accueil, ou la passer en `noindex` via votre extension SEO.

---

## 5. Favicons

Les favicons de `public/` sont déposés à la racine avec la landing et référencés par `index.html`. Pour que les **autres pages WordPress** affichent la même icône :

1. Dans WordPress : **Apparence → Personnaliser → Identité du site** (ou **Réglages → Général** sur les thèmes bloc).
2. **Icône du site** → téléversez `wordpress-favicons/icon-512.png`.
3. WordPress génère les autres tailles automatiquement.

Détails et alternatives : [wordpress-favicons/README.md](wordpress-favicons/README.md).

## 6. SEO : robots.txt et sitemap.xml

Un fichier physique `robots.txt` ou `sitemap.xml` à la racine **prend le pas** sur ceux générés par WordPress ou par une extension SEO.

| Situation | Que faire |
|---|---|
| Une extension SEO est installée (Yoast, Rank Math, SEOPress, AIOSEO…) | **Ne téléversez pas** `robots.txt` ni `sitemap.xml` (excluez-les de l'archive ZIP). Laissez l'extension les générer ; ses sitemaps (`/sitemap_index.xml`, `/wp-sitemap.xml`…) incluent déjà la page d'accueil. |
| Aucune extension SEO | Vous pouvez utiliser ceux de `public/`, **après** avoir mis à jour les dates `<lastmod>` et vérifié que toutes les URL listées existent. |

Pensez ensuite à déclarer le sitemap dans [Google Search Console](https://search.google.com/search-console).

Les balises `canonical`, Open Graph et Twitter de `index.html` pointent vers `https://www.nousavonsdeselles.fr/`. Si le domaine change (préproduction, autre domaine), mettez-les à jour.

## 7. Mettre à jour la landing page

1. Modifiez `public/index.html` et/ou `public/styles.css`. Les textes français sont dans `index.html` ; chaque texte traduit porte un attribut `data-i18n="clé"` et sa version anglaise se trouve sous la même clé dans `public/i18n.js`. Si vous changez un texte français, mettez aussi à jour sa traduction (une clé sans traduction reste affichée en français).
2. Nouvelles photos : ajoutez-les dans `../img/…`, déclarez-les dans `scripts/convert-images.mjs`, puis lancez `npm run convert-images`.
3. Nouveau logo : remplacez `src/logo-source.png` (et ajustez les zones `FULL_BOX` / `EMBLEM_BOX` du script si les proportions changent), puis lancez `npm run favicons`.
4. Vérifiez en local avec `npm run dev`.
5. Espace client OVH → **FTP-SSH** → **Explorateur FTP** → dossier racine :
   - pour un ou deux fichiers modifiés : **Upload** dans la zone *Fichiers*, en confirmant l'écrasement ;
   - pour beaucoup de fichiers (nouvelles images…) : refaites une archive ZIP **avec seulement les fichiers modifiés, en respectant l'arborescence** (`images/lesprecieuses/…`) et envoyez-la dans la zone *Archives*.
6. Videz les caches (CDN OVH, extension WordPress, navigateur).

> **Astuce cache :** les navigateurs gardent `styles.css` en mémoire. Après une modification, changez le lien dans `index.html` en `styles.css?v=2` (puis `v=3`, etc.) pour forcer le rechargement chez les visiteurs.

## 8. Liste de vérification après mise en ligne

- [ ] La page d'accueil affiche la landing page (en navigation privée).
- [ ] Les liens vers `/station-coeur/`, `/les-precieuses/`, `/mentions-legales/` et `/politique-confidentialite/` fonctionnent.
- [ ] `/wp-admin/` est toujours accessible.
- [ ] Les images s'affichent (aucune erreur 404 dans la console, touche `F12` → onglet *Réseau*).
- [ ] Le menu mobile et le carrousel fonctionnent sur téléphone.
- [ ] Le favicon apparaît dans l'onglet du navigateur.
- [ ] Les liens `mailto:` et `tel:` ouvrent bien l'application de messagerie / d'appel.
- [ ] `https://www.nousavonsdeselles.fr/robots.txt` affiche le bon contenu.
- [ ] Le site passe correctement dans [PageSpeed Insights](https://pagespeed.web.dev/).
- [ ] Le partage du lien sur Facebook / LinkedIn affiche la bonne image (testez avec le [Débogueur de partage Facebook](https://developers.facebook.com/tools/debug/)).

## 9. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Connexion refusée à l'Explorateur FTP | Mauvais mot de passe, ou changement pas encore pris en compte | Onglet **FTP-SSH** → `…` → **Modifier le mot de passe**, attendre quelques minutes et réessayer |
| L'ancienne page d'accueil WordPress s'affiche toujours | Cache | Vider le cache du CDN OVH (onglet **Multisite**), de l'extension WordPress et du navigateur |
| Idem, même après vidage du cache | Ligne `DirectoryIndex` absente, mal placée, ou fichiers dans le mauvais dossier | Vérifier que la ligne est **au-dessus** du bloc WordPress et que `index.html` est bien dans le **dossier racine** indiqué dans l'onglet **Multisite** |
| Les fichiers sont dans `www/public/` | Le dossier `public/` a été zippé au lieu de son contenu | Supprimer `www/public/` et recommencer l'étape 4 en sélectionnant le contenu du dossier |
| Page sans mise en forme | `styles.css` introuvable | Vérifier qu'il est au même niveau que `index.html` |
| Le bouton EN ne change rien, carrousels figés | `i18n.js` ou `site.js` introuvable | Vérifier que les deux fichiers sont au même niveau que `index.html` |
| Images manquantes | Dossier `images/` mal placé, ou casse différente | Respecter l'arborescence ; les noms de fichiers sont **sensibles à la casse** sur l'hébergement OVH |
| Erreur 500 après modification du `.htaccess` | Faute de frappe | Rouvrir le `.htaccess` dans l'Explorateur FTP, recoller le contenu sauvegardé à l'étape 1, puis recommencer |
| Les pages WordPress renvoient une erreur 404 | Règles de réécriture perdues | WordPress → **Réglages → Permaliens** → *Enregistrer les modifications* (sans rien changer) |
| Le `.htaccess` n'apparaît pas dans l'Explorateur FTP | Le fichier n'existe pas encore | WordPress → **Réglages → Permaliens** → *Enregistrer* pour le créer, ou créez-le avec **New file** dans le dossier racine |

## 10. Revenir en arrière

Depuis l'espace client OVH → **FTP-SSH** → **Explorateur FTP** → dossier racine, au choix :

- **Le plus rapide :** renommez `index.html` en `index.html.off` (bouton **Rename**). Le serveur ne trouve plus `index.html` et WordPress reprend immédiatement la main sur la page d'accueil.
- **Retour complet :** supprimez la ligne `DirectoryIndex index.html index.php` du `.htaccess` (ou recollez le contenu sauvegardé), puis supprimez les fichiers de la landing (`index.html`, `styles.css`, `i18n.js`, `site.js`, `images/`, favicons, `site.webmanifest`).
- **En cas de problème grave :** onglet **FTP-SSH** → **Restaurer une sauvegarde** pour revenir à l'état des fichiers d'un jour précédent.

Pensez à vider les caches après le retour en arrière.

---

## Charte graphique

| Rôle | Couleur |
|---|---|
| Principale (vert sauge) | `#6b9670` |
| Accent (corail) | `#ec8d70` |
| Fond (crème) | `#fbf4eb` |

Polices : **Playfair Display** (titres) et **Lato** (texte), chargées depuis Google Fonts.

> 🔒 **RGPD :** Google Fonts est chargé depuis les serveurs de Google, ce qui transmet l'adresse IP des visiteurs. Pour une conformité stricte, hébergez les polices localement (par exemple avec [google-webfonts-helper](https://gwfh.mranftl.com/fonts)) ou mentionnez ce transfert dans la politique de confidentialité.

## Contact

Association **Nous Avons Des Elles** — [nous.avons.des.elles@gmail.com](mailto:nous.avons.des.elles@gmail.com)
