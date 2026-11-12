/*
 * Nous Avons Des Elles: translations.
 * The French text lives in index.html (it is what search engines and visitors without
 * JavaScript read) and is limited to the text of www.nousavonsdeselles.fr. This file holds
 * the English version of every string, keyed like the data-i18n and data-i18n-attr
 * attributes of the page.
 *
 * To add a language: add a dictionary below (same keys as EN), add its runtime strings,
 * list it in SUPPORTED and add a button with data-lang="xx" in the header.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'nade-lang';
  var SUPPORTED = ['fr', 'en'];

  /* Strings the scripts build at runtime (carousels, menu), in every language. */
  var RUNTIME = {
    fr: {
      'carousel.goto': 'Aller à la diapositive {n}',
      'carousel.pos': '{n} sur {total}',
      'carousel.pause': 'Mettre en pause le défilement',
      'carousel.play': 'Reprendre le défilement',
      'menu.open': 'Ouvrir le menu',
      'menu.close': 'Fermer le menu'
    },
    en: {
      'carousel.goto': 'Go to slide {n}',
      'carousel.pos': '{n} of {total}',
      'carousel.pause': 'Pause the slideshow',
      'carousel.play': 'Resume the slideshow',
      'menu.open': 'Open the menu',
      'menu.close': 'Close the menu'
    }
  };

  /* Static strings of the page, in English: the text of www.nousavonsdeselles.fr, translated. */
  var EN = {
    'skip': 'Skip to main content',

    /* Header */
    'nav.label': 'Main navigation',
    'nav.home': 'Nous avons des ELLES, home',
    'nav.about': 'Who we are',
    'nav.projects': 'Our projects',
    'nav.contact': 'Contact us',

    /* Hero */
    'hero.since': 'An association committed since 2018',
    'hero.lead': 'Repairing objects, revealing talents, rebuilding connections. Making reuse a driver of inclusion, solidarity and ecological transition.',
    'portal.sc.kicker': 'Solidarity hub',
    'portal.sc.desc': 'A train station reinvented as a place of solidarity, eco-friendly and intergenerational: a thrift shop, a café, workshops, a games library and much more.',
    'portal.lp.kicker': 'In-company resource shop',
    'portal.lp.desc': 'An elegant, nomadic second-hand corner, set up for the long term inside companies to raise employees’ awareness of reuse.',
    'sc.site.href': 'https://www.nousavonsdeselles.fr/station-coeur/en/',
    'carousel.role': 'carousel',
    'carousel.slide': 'slide',
    'carousel.prev': 'Previous slide',
    'carousel.next': 'Next slide',
    'hero.s1.alt': 'The team, arms wide open, in front of the solidarity shop',
    'hero.s2.alt': 'Two colleagues choosing second-hand clothes together, and colleagues on a coffee break at the office',
    'hero.s3.alt': 'Hats and smiles on the terrace in front of the station',
    'hero.s4.alt': 'A shared moment on the steps',
    'hero.s5.alt': 'A volunteer sorting donated clothes, beside a donations box and clothes being packed for collection',
    'hero.s6.alt': 'Two smiles in front of the shop',

    /* Who we are */
    'about.title': 'An association born to rebuild connections',
    'about.p1': 'Founded in 2018, Nous avons des ELLES was born from a strong intuition: in a society where isolation, insecurity and the loss of social ties are growing, it has become urgent to create spaces where people can come together, pass things on, repair and share.',
    'about.p2': 'We hold a deeply human vision of the ecological transition: an everyday ecology that is accessible, practical and warm, one that brings people together rather than making them feel guilty.',
    'about.t1': 'The association is founded, with the will to create practical forms of solidarity and human connection.',
    'about.t2.when': 'First step',
    'about.t2': 'A pilot at the Tiny House of the Quai des Possibles in Saint-Germain-en-Laye. A network of volunteers and donors, and the concept proven.',
    'about.t3.when': 'Today',
    'about.t3': 'Two complementary projects: Les Précieuses in companies and Station Cœur in a train station.',
    'about.quote': '“Objects can have a second life, places can find their soul again, and people can find their place again.”',
    'about.conviction': 'Our conviction: linking social issues with ecological ones. Reuse, second-hand, repair and the circular economy are powerful levers to protect the planet, create activity and help people back into work.',

    /* Values */
    'eyebrow.values': 'Our values',
    'values.title': 'The values that drive us',
    'values.v1.title': 'Reuse & circular economy',
    'values.v1.text': 'Giving value to donated clothes, accessories, objects and furniture to extend their life and reduce waste.',
    'values.v2.title': 'Inclusion & dignity',
    'values.v2.text': 'Creating spaces where everyone can regain a place, a purpose, confidence and recognition',
    'values.v3.title': 'Inter­generational connection',
    'values.v3.text': 'Building bridges between generations through games, workshops, passing on knowledge and moments of togetherness.',
    'values.v4.title': 'Living communities',
    'values.v4.text': 'Helping to create local places that are useful, beautiful, lively and accessible.',

    /* Our projects */
    'projects.title': 'Two projects, one shared ambition',
    'projects.desc': 'Turning everyday spaces into places that are more useful, more human and more sustainable.',
    'sc.photo.alt': 'Volunteers in front of the station, flowers in hand',
    'sc.title': 'The train station reinvented as a place of solidarity',
    'sc.intro': 'Station Cœur imagines a train station transformed into a true living space: a place of welcome, services, togetherness, reuse, culture and intergenerational connection.',
    'sc.chip1': 'Reuse & workshops',
    'sc.chip2': 'Social connection',
    'sc.chip3': 'Intergenerational',
    'sc.f1': 'Thrift shop, café-canteen, upcycling and repair workshops',
    'sc.f2': 'Library of objects and games library',
    'sc.f3': 'Cultural events and the Jardin des Papotages',
    'sc.f4': 'Local services for residents and travellers',
    'lp.photo.alt': 'An employee choosing a second-hand pair of jeans',
    'lp.title': 'Second-hand fashion that comes right into the workplace',
    'lp.intro': 'Les Précieuses is an eco-friendly, nomadic resource shop, designed to settle for the long term in company premises as an elegant, lively second-hand corner.',
    'lp.chip1': 'Solidarity reuse',
    'lp.chip2': 'Awareness',
    'lp.chip3': 'Social connection',
    'lp.f1': 'Donated items given value to benefit the association',
    'lp.f2': 'Raising awareness of reuse and the circular economy',
    'lp.f3': 'A visible solidarity and ecological action for employees',
    'lp.f4': 'Awareness workshops and events available',

    /* Who for */
    'eyebrow.audiences': 'Who it’s for',
    'aud.title': 'Projects designed to bring different people together',
    'aud.1.t': 'Seniors',
    'aud.1.d': 'A place to break out of isolation, pass on knowledge, take part in activities and regain an active role in local life.',
    'aud.2.t': 'Families',
    'aud.2.d': 'Accessible, useful and friendly solutions: clothes, objects, games, activities, workshops and shared moments.',
    'aud.3.t': 'Women in transition',
    'aud.3.d': 'A caring setting to regain confidence, feel useful, develop skills and widen one’s network.',
    'aud.4.t': 'Travellers',
    'aud.4.d': 'A station where you can have a coffee, pick up a basket, shop responsibly or simply pause for a moment.',
    'aud.5.t': 'Companies',
    'aud.5.d': 'A practical way to bring a CSR approach to life, raise employees’ awareness and create a visible action.',
    'aud.6.t': 'Local authorities',
    'aud.6.d': 'An answer to the challenges of circular economy, social connection, inclusion and local revitalisation.',

    /* Our impact */
    'eyebrow.impact': 'Our impact',
    'impact.title': 'A tangible chain of impact',
    'impact.desc': 'Our projects are not isolated actions but ecosystems. Every gesture sets off a positive chain reaction: for people, for places, for the community.',
    'impact.1': 'A garment donated',
    'impact.2': 'A resource put to good use',
    'impact.3': 'A meeting sparked',
    'impact.4': 'A skill revealed',
    'impact.5': 'A living community',

    /* Join the adventure */
    'eyebrow.support': 'Support us',
    'support.title': 'Join the adventure',
    'support.lead': 'Nous avons des ELLES moves forward thanks to the energy of everyone who believes in practical, human and sustainable projects. Every bit of support counts.',
    'support.note': 'Companies & local authorities, let’s act together',
    'support.tab.coll': 'Local authorities',
    'support.tab.ent': 'Companies',
    'support.tab.ben': 'Volunteers',
    'support.tab.don': 'Donors',
    'support.coll.title': 'Local authorities: host Station Cœur',
    'support.coll.one': 'Support Station Cœur and help create a solidarity hub.',
    'support.coll.p1': 'Station Cœur meets the real needs of local areas: recreating local places, strengthening social ties, supporting families, helping seniors and encouraging reuse.',
    'support.coll.p2': 'Hosting or supporting Station Cœur means contributing to a lively, low-impact facility aligned with today’s transition challenges.',
    'support.ent.title': 'Companies: host Les Précieuses',
    'support.ent.one': 'Host a Les Précieuses corner: an elegant and meaningful CSR action.',
    'support.ent.p1': 'With Les Précieuses, offer your employees a CSR action that is practical, visible and easy to understand. A lively space, set up for the long term, that can grow with your commitments.',
    'support.ent.p2': 'It can be deployed as a permanent corner, a semi-permanent presence or a stepped-up event format. Every partnership is tailor-made.',
    'support.ben.one': 'Join a human adventure built around reuse, solidarity and social connection.',
    'support.don.one': 'Help develop a useful, lively and sustainable project.',

    /* Gallery */
    'eyebrow.gallery': 'Gallery',
    'contact.quote': '“Nous avons des ELLES does not only create reuse projects. The association creates spaces where solidarity, ecology and dignity come back to life.”',
    'gallery.label': 'Photo gallery',
    'gal.t1': 'Across generations',
    'gal.c1': 'A game across generations',
    'gal.t2': 'Meeting at the station',
    'gal.c2': 'Two residents on the station forecourt',
    'gal.t3': 'Neighbourhood encounters',
    'gal.c3': 'A meeting with a dog in front of the shop',
    'gal.t4': 'The station comes back to life',
    'gal.c4': 'A resident in front of the station',
    'gal.t5': 'A place for everyone',
    'gal.c5': 'Portrait of a smiling resident',

    /* Partners */
    'eyebrow.partners': 'Our partners',
    'partners.title': 'They support us',
    'partners.desc': 'Companies, institutions and partners: each contributes to a project that combines reuse and solidarity.',

    /* Contact and footer */
    'contact.linkedin': 'Find us on LinkedIn',
    'footer.top': 'Nous avons des ELLES, top of the page',
    'footer.tagline': 'An association committed to reuse, inclusion, intergenerational connection and the ecological transition.',
    'footer.addresses': 'Our addresses',
    'footer.hq': 'Head office',
    'footer.legal': 'Non-profit association under the French law of 1901, RNA: W942006742'
  };

  var DICTS = { en: EN };
  var originals = new Map();
  var listeners = [];
  var current = 'fr';
  var warned = {};

  function snapshot(el) {
    var o = originals.get(el);
    if (o) return o;
    o = { attrs: {} };
    if (el.hasAttribute('data-i18n')) o.text = el.textContent;
    if (el.hasAttribute('data-i18n-html')) o.html = el.innerHTML;
    var spec = el.getAttribute('data-i18n-attr');
    if (spec) {
      spec.split('|').forEach(function (pair) {
        var name = pair.split(':')[0].trim();
        o.attrs[name] = el.getAttribute(name);
      });
    }
    originals.set(el, o);
    return o;
  }

  function pick(lang, key, fallback) {
    var dict = DICTS[lang];
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (!warned[key] && window.console) { console.warn('[i18n] missing "' + key + '" for ' + lang); warned[key] = true; }
    return fallback;
  }

  function apply(lang) {
    var nodes = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var o = snapshot(el);
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = lang === 'fr' ? o.text : pick(lang, key, o.text);
      key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = lang === 'fr' ? o.html : pick(lang, key, o.html);
      var spec = el.getAttribute('data-i18n-attr');
      if (spec) {
        spec.split('|').forEach(function (pair) {
          var parts = pair.split(':');
          var name = parts[0].trim();
          var k = parts.slice(1).join(':').trim();
          var value = lang === 'fr' ? o.attrs[name] : pick(lang, k, o.attrs[name]);
          if (value === null || value === undefined) el.removeAttribute(name);
          else el.setAttribute(name, value);
        });
      }
    }
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    var buttons = document.querySelectorAll('[data-lang]');
    for (var j = 0; j < buttons.length; j++) {
      if (buttons[j] === document.documentElement) continue;
      buttons[j].setAttribute('aria-pressed', String(buttons[j].getAttribute('data-lang') === lang));
    }
  }

  function remember(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      if (lang === 'fr') url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function set(lang, persist) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'fr';
    current = lang;
    apply(lang);
    if (persist !== false) remember(lang);
    document.documentElement.classList.remove('i18n-pending');
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }

  function t(key, vars) {
    var table = RUNTIME[current] || RUNTIME.fr;
    var s = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : (RUNTIME.fr[key] || key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, name) { return name in vars ? vars[name] : m; });
    return s;
  }

  window.I18N = {
    t: t,
    set: set,
    on: function (fn) { listeners.push(fn); },
    get lang() { return current; },
    supported: SUPPORTED.slice(),
    keys: function () { return Object.keys(EN); }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button[data-lang]');
    if (btn) set(btn.getAttribute('data-lang'));
  });

  var initial = document.documentElement.getAttribute('data-lang') || 'fr';
  set(initial, false);
})();
