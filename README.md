# Landing page — Nous Avons Des Elles

Page d'accueil statique (HTML/CSS/JS, sans framework) de l'association **Nous Avons Des Elles**, qui présente ses deux projets : **Station-Cœur** et **Les Précieuses**.

Elle est faite pour devenir la **page d'accueil d'un site WordPress existant** (`https://www.nousavonsdeselles.fr`). Le reste du site (pages `/station-coeur/`, `/les-precieuses/`, mentions légales, etc.) reste géré par WordPress.

---

## Sommaire

1. [Contenu du projet](#1-contenu-du-projet)
2. [Prérequis](#2-prérequis)
3. [Travailler en local](#3-travailler-en-local)
4. [Intégration dans un site WordPress existant](#4-intégration-dans-un-site-wordpress-existant)
   - [Méthode A — Fichiers statiques à la racine (recommandée)](#méthode-a--fichiers-statiques-à-la-racine-recommandée)
   - [Méthode B — Modèle de page dans un thème enfant](#méthode-b--modèle-de-page-dans-un-thème-enfant)
   - [Méthode C — Bloc « HTML personnalisé » (dépannage)](#méthode-c--bloc--html-personnalisé--dépannage)
5. [Favicons](#5-favicons)
6. [SEO : robots.txt et sitemap.xml](#6-seo--robotstxt-et-sitemapxml)
7. [Mettre à jour la landing page](#7-mettre-à-jour-la-landing-page)
8. [Liste de vérification après mise en ligne](#8-liste-de-vérification-après-mise-en-ligne)
9. [Dépannage](#9-dépannage)
10. [Revenir en arrière](#10-revenir-en-arrière)

---

## 1. Contenu du projet

```
landing/
├── public/                  ← LE LIVRABLE : tout ce qui part sur le serveur
│   ├── index.html           ← la landing page (CSS externe, JS intégré)
│   ├── styles.css
│   ├── images/
│   │   ├── logo/            ← logo et emblème (PNG + WebP)
│   │   ├── lesprecieuses/   ← photos optimisées (large / medium / thumb)
│   │   └── station-coeur/
│   ├── favicon.ico, favicon.svg, favicon-*.png, apple-touch-icon.png, …
│   ├── site.webmanifest
│   ├── robots.txt
│   └── sitemap.xml
├── wordpress-favicons/      ← kit de favicons prêt à téléverser dans WordPress
├── scripts/
│   ├── convert-images.mjs   ← conversion des photos en WebP multi-tailles
│   └── generate-favicons.mjs← génération du logo et des favicons
├── src/logo-source.png      ← logo source (haute définition, fond transparent)
└── package.json
```

> **Bon à savoir :** `index.html` utilise uniquement des **chemins relatifs** (`styles.css`, `images/...`, `favicon.svg`). Les fichiers doivent donc garder la même arborescence que dans `public/` une fois sur le serveur.

## 2. Prérequis

| Pour… | Il faut |
|---|---|
| Modifier et prévisualiser la page | [Node.js](https://nodejs.org/) 18 ou plus récent |
| Déployer | Un accès **FTP/SFTP** ou au **gestionnaire de fichiers** de l'hébergeur (cPanel, Plesk, o2switch, OVH, Hostinger…) |
| Méthode B | Un accès administrateur WordPress et un **thème enfant** |
| Dans tous les cas | Une **sauvegarde complète** du site (fichiers + base de données) avant toute modification |

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
| `npm run favicons` | Régénère logo + favicons depuis `src/logo-source.png` vers `public/` **et** `wordpress-favicons/` |
| `npm run build` | Alias de `convert-images` |

> Les photos sources ne sont **pas** dans ce dépôt : `convert-images` les lit dans le dossier voisin `../img/lesprecieuses/` et `../img/station-coeur/`. Les images déjà optimisées de `public/images/` sont, elles, versionnées.

---

## 4. Intégration dans un site WordPress existant

Trois méthodes, de la plus fiable à la moins fiable. **Choisissez-en une seule.**

| | A. Fichiers statiques | B. Modèle de page | C. Bloc HTML |
|---|---|---|---|
| Fidélité au design | ✅ Parfaite | ✅ Parfaite | ⚠️ Conflits avec le thème |
| Performance | ✅ Maximale (pas de PHP) | 🟡 Bonne | 🟡 Variable |
| Modifiable depuis l'admin WP | ❌ | ❌ (fichiers du thème) | ✅ |
| Survit à un changement de thème | ✅ | ❌ | 🟡 |
| Niveau technique | FTP + `.htaccess` | FTP + un peu de PHP | Aucun |

### Méthode A — Fichiers statiques à la racine (recommandée)

**Principe :** on dépose la landing page à côté de WordPress et on indique au serveur de servir `index.html` en priorité pour l'URL `/`. Toutes les autres URL (`/station-coeur/`, `/wp-admin/`, etc.) continuent d'être traitées par WordPress.

#### Étape 1 — Sauvegarder

Téléchargez une copie du fichier `.htaccess` présent à la racine du site (même dossier que `wp-config.php`). C'est votre filet de sécurité.

#### Étape 2 — Téléverser les fichiers

Avec FileZilla (ou le gestionnaire de fichiers de l'hébergeur), copiez **le contenu** de `public/` à la racine WordPress :

```
public_html/                 ← racine WordPress (contient déjà wp-config.php)
├── index.php                ← WordPress (NE PAS supprimer)
├── index.html               ← nouveau
├── styles.css               ← nouveau
├── images/                  ← nouveau
├── favicon.ico, favicon.svg, favicon-*.png, apple-touch-icon.png, …  ← nouveaux
├── site.webmanifest         ← nouveau
├── wp-admin/  wp-content/  wp-includes/  …
└── .htaccess
```

> ⚠️ **Ne téléversez pas `robots.txt` ni `sitemap.xml`** si une extension SEO (Yoast, Rank Math, SEOPress…) est installée : voir [section 6](#6-seo--robotstxt-et-sitemapxml).
>
> ⚠️ Vérifiez qu'il n'existe pas déjà un dossier `images/` ou un fichier `styles.css` à la racine. Si c'est le cas, renommez-les côté landing (et mettez à jour les chemins dans `index.html`) plutôt que d'écraser l'existant.

#### Étape 3 — Donner la priorité à `index.html`

**Serveur Apache / LiteSpeed** (le cas de la plupart des hébergements mutualisés) — ajoutez cette ligne **tout en haut** du `.htaccess`, **au-dessus** du bloc `# BEGIN WordPress` :

```apache
# Landing page statique servie sur la page d'accueil
DirectoryIndex index.html index.php
```

Le fichier doit ressembler à ceci :

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

**Serveur Nginx** — dans le bloc `server` (ou demandez à votre hébergeur) :

```nginx
index index.html index.php;

location = / {
    try_files /index.html /index.php?$args;
}

location / {
    try_files $uri $uri/ /index.php?$args;
}
```

Puis rechargez Nginx (`sudo nginx -t && sudo systemctl reload nginx`).

#### Étape 4 — Accès à l'accueil WordPress

La page d'accueil WordPress d'origine reste accessible via `https://www.nousavonsdeselles.fr/index.php`. Pour éviter tout contenu dupliqué, vous pouvez dans **Réglages → Lecture** choisir une page statique simple comme page d'accueil, ou la passer en `noindex` via votre extension SEO.

#### Étape 5 — Vider les caches

- Extension de cache (WP Rocket, LiteSpeed Cache, W3 Total Cache, WP Super Cache…) : **Vider tout le cache**.
- CDN (Cloudflare…) : **Purge Everything**.
- Navigateur : `Ctrl + F5` (ou fenêtre de navigation privée).

✅ Ouvrez `https://www.nousavonsdeselles.fr/` : la landing page doit s'afficher, et les liens « Station-Cœur » / « Les Précieuses » doivent mener aux pages WordPress.

---

### Méthode B — Modèle de page dans un thème enfant

**Principe :** la landing page devient un modèle de page du thème. Elle est choisie comme page d'accueil dans **Réglages → Lecture**. Utile si l'hébergeur interdit la modification du `.htaccess`, ou si vous voulez profiter des extensions WordPress (statistiques, cookies…) sur la page.

> Un **thème enfant** est indispensable : sans lui, la prochaine mise à jour du thème effacerait vos fichiers.

#### Étape 1 — Copier les fichiers dans le thème enfant

```
wp-content/themes/<votre-theme-enfant>/
├── page-landing.php         ← à créer (voir ci-dessous)
└── landing/
    ├── styles.css           ← copie de public/styles.css
    └── images/              ← copie de public/images/
```

#### Étape 2 — Créer `page-landing.php`

1. Copiez `public/index.html` dans `page-landing.php`.
2. Ajoutez cet en-tête **tout en haut** du fichier, avant `<!DOCTYPE html>` :

   ```php
   <?php
   /**
    * Template Name: Landing — Nous Avons Des Elles
    */
   $landing = get_stylesheet_directory_uri() . '/landing';
   ?>
   ```

3. Remplacez les chemins relatifs par des chemins absolus :

   | Dans `index.html` | Devient dans `page-landing.php` |
   |---|---|
   | `href="styles.css"` | `href="<?php echo esc_url( $landing ); ?>/styles.css"` |
   | `src="images/…"` / `srcset="images/…"` / `href="images/…"` | `…="<?php echo esc_url( $landing ); ?>/images/…"` |

   Astuce : dans VS Code, rechercher/remplacer `"images/` par `"<?php echo esc_url( $landing ); ?>/images/` (attention aux `srcset` qui contiennent plusieurs images séparées par des virgules : chaque chemin doit être préfixé).

4. **Favicons :** supprimez le bloc `<!-- Favicon Package -->` du modèle et utilisez l'icône du site WordPress (voir [section 5](#5-favicons)).

5. **Optionnel — extensions WordPress :** pour que les extensions (Google Analytics, bandeau cookies, Matomo…) fonctionnent sur la page, ajoutez :
   - `<?php wp_head(); ?>` juste avant `</head>` ;
   - `<?php wp_footer(); ?>` juste avant `</body>`.

   ⚠️ Cela charge aussi le CSS du thème, qui peut entrer en conflit avec la landing. Si l'affichage se dégrade, retirez le CSS du thème uniquement sur cette page dans le `functions.php` du thème enfant :

   ```php
   add_action( 'wp_enqueue_scripts', function () {
       if ( is_page_template( 'page-landing.php' ) ) {
           // Remplacez par les identifiants (handles) des feuilles de style de votre thème
           wp_dequeue_style( 'parent-style' );
           wp_dequeue_style( 'child-style' );
           wp_dequeue_style( 'wp-block-library' );
           wp_dequeue_style( 'global-styles' );
       }
   }, 100 );
   ```

#### Étape 3 — Créer la page et la définir comme accueil

1. **Pages → Ajouter** : titre « Accueil », contenu vide.
2. Dans le panneau de droite, **Modèle** → *Landing — Nous Avons Des Elles*. Publiez.
3. **Réglages → Lecture** → *La page d'accueil affiche* : **Une page statique** → *Page d'accueil* : **Accueil**. Enregistrez.
4. Videz les caches (voir méthode A, étape 5).

---

### Méthode C — Bloc « HTML personnalisé » (dépannage)

À n'utiliser que si vous n'avez **aucun accès aux fichiers** du serveur. Le rendu ne sera pas identique, car le thème ajoute son en-tête, son pied de page et ses styles.

1. Téléversez les images de `public/images/` dans la **Médiathèque** et notez leurs URL.
2. Créez une page avec un modèle « pleine largeur / sans titre » (selon le thème).
3. Ajoutez un bloc **HTML personnalisé** et collez le contenu situé **entre `<body>` et `</body>`** de `index.html`, en retirant le `<header>` et le `<footer>` si le thème affiche déjà les siens.
4. Remplacez chaque `images/…` par l'URL de la Médiathèque correspondante.
5. Collez le contenu de `styles.css` dans **Apparence → Personnaliser → CSS additionnel** (ou **Éditeur du site → Styles → CSS additionnel** sur un thème bloc).
6. Le `<script>` en bas de page est souvent supprimé par WordPress : ajoutez-le via une extension du type *WPCode* (emplacement « Pied de page », uniquement sur cette page).
7. Définissez la page comme page d'accueil (**Réglages → Lecture**).

---

## 5. Favicons

Le dossier [`wordpress-favicons/`](wordpress-favicons/) contient un kit complet. Le plus simple :

1. **Apparence → Personnaliser → Identité du site** (ou **Réglages → Général** sur les thèmes bloc).
2. **Icône du site** → téléversez `wordpress-favicons/icon-512.png`.
3. WordPress génère les autres tailles automatiquement.

Avec la **méthode A**, les favicons de `public/` sont déjà à la racine et référencés par `index.html` : l'icône WordPress servira pour les autres pages. Utilisez la même image partout pour rester cohérent.

Détails et alternatives : [wordpress-favicons/README.md](wordpress-favicons/README.md).

## 6. SEO : robots.txt et sitemap.xml

Un fichier physique `robots.txt` ou `sitemap.xml` à la racine **prend le pas** sur ceux générés par WordPress ou par une extension SEO.

| Situation | Que faire |
|---|---|
| Une extension SEO est installée (Yoast, Rank Math, SEOPress, AIOSEO…) | **Ne téléversez pas** `robots.txt` ni `sitemap.xml`. Laissez l'extension les générer ; ses sitemaps (`/sitemap_index.xml`, `/wp-sitemap.xml`…) incluent déjà la page d'accueil. |
| Aucune extension SEO | Vous pouvez utiliser ceux de `public/`, **après** avoir mis à jour les dates `<lastmod>` et vérifié que toutes les URL listées existent. |

Pensez ensuite à déclarer le sitemap dans [Google Search Console](https://search.google.com/search-console).

Les balises `canonical`, Open Graph et Twitter de `index.html` pointent vers `https://www.nousavonsdeselles.fr/`. Si le domaine change (préproduction, autre domaine), mettez-les à jour.

## 7. Mettre à jour la landing page

1. Modifiez `public/index.html` et/ou `public/styles.css`.
2. Nouvelles photos : ajoutez-les dans `../img/…`, déclarez-les dans `scripts/convert-images.mjs`, puis lancez `npm run convert-images`.
3. Nouveau logo : remplacez `src/logo-source.png` (et ajustez les zones `FULL_BOX` / `EMBLEM_BOX` du script si les proportions changent), puis lancez `npm run favicons`.
4. Vérifiez en local avec `npm run dev`.
5. Téléversez **uniquement les fichiers modifiés** (méthode A : à la racine ; méthode B : dans le thème enfant, en reportant les modifications dans `page-landing.php`).
6. Videz les caches (extension, CDN, navigateur).

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
| L'ancienne page d'accueil WordPress s'affiche toujours | Cache | Vider le cache de l'extension, du CDN et du navigateur |
| Idem, même après vidage du cache | `DirectoryIndex` ignoré ou serveur Nginx | Vérifier que la ligne est **au-dessus** du bloc WordPress ; sur Nginx, voir la configuration de la méthode A ; sinon, contacter l'hébergeur |
| Page sans mise en forme | `styles.css` introuvable | Vérifier qu'il est au même niveau que `index.html` (méthode A) ou que le chemin PHP est correct (méthode B) |
| Images manquantes | Dossier `images/` mal placé, ou casse différente | Respecter l'arborescence ; les noms de fichiers sont **sensibles à la casse** sur Linux |
| Erreur 500 après modification du `.htaccess` | Faute de frappe | Restaurer la sauvegarde du `.htaccess` puis recommencer |
| Les pages WordPress renvoient une erreur 404 | Règles de réécriture perdues | **Réglages → Permaliens** → *Enregistrer les modifications* (sans rien changer) |
| Mise en page cassée avec la méthode B | Le CSS du thème s'applique | Retirer `wp_head()` ou désactiver les styles du thème (voir méthode B, étape 2.5) |
| Le carrousel ou le menu mobile ne réagit pas (méthode C) | Le `<script>` a été filtré | L'ajouter via une extension comme *WPCode* |

## 10. Revenir en arrière

- **Méthode A :** supprimez la ligne `DirectoryIndex index.html index.php` du `.htaccess` (ou restaurez la sauvegarde). WordPress reprend immédiatement la main sur la page d'accueil. Les fichiers de la landing peuvent rester en place ou être supprimés.
- **Méthode B :** **Réglages → Lecture** → remettez l'ancienne page d'accueil.
- **Méthode C :** **Réglages → Lecture** → remettez l'ancienne page d'accueil, puis supprimez le CSS additionnel.

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
