/* Lien entre un outil et le portail « Le cartable magique ».
   Chargé par le portail ET par chaque outil (<script src="../portail.js">).
   - affiche le numéro de version (venu de version.js) dans la signature ;
   - affiche les boutons « Accueil » (cachés quand l'outil est ouvert seul, hors du portail) ;
   - rend l'installation obligatoire sur le site (écran « Installer ») ;
   - envoie des statistiques anonymes d'utilisation (aucun affichage) ;
   - active le fonctionnement hors ligne et la mise à jour automatique.
   M. Guitton — fichier mis au point avec l'aide de Claude AI. */
(function () {
  const racine = new URL('./', document.currentScript.src);          // adresse du portail
  const enLigne = /^https?:$/.test(location.protocol);

  /* 1. On est dans le portail : les boutons « Accueil » deviennent visibles */
  document.documentElement.classList.add('dans-portail');

  /* 2. Installation obligatoire : sur le site, ouvert dans un simple onglet du navigateur
     (et non dans l'appli installée), on ne laisse pas utiliser les outils :
     - un outil renvoie aussitôt vers l'accueil ;
     - l'accueil affiche l'écran « Installer » à la place des tuiles (voir index.html).
     Ainsi tout le monde utilise l'appli installée, qui se met à jour toute seule.
     Le fichier ouvert depuis le disque (file://) n'est pas concerné. */
  const dansAppli = ['fullscreen', 'standalone', 'minimal-ui', 'window-controls-overlay']
    .some(m => matchMedia('(display-mode: ' + m + ')').matches) || navigator.standalone === true;
  const surAccueil = new URL('./', location.href).href === racine.href;
  // L'appli installée laisse une marque (même site = même mémoire) : l'onglet du navigateur
  // saura ainsi qu'elle est déjà installée sur cet ordinateur.
  if (enLigne && dansAppli) { try { localStorage.setItem('cartable-installe', '1'); } catch (e) {} }
  if (enLigne && !dansAppli) {
    if (!surAccueil) { location.replace(racine.href); return; }
    document.documentElement.classList.add('a-installer');
    // Chrome / Edge / Brave proposent l'installation par cet événement, parfois très tôt :
    // on le garde de côté pour le bouton « Installer » de l'accueil.
    addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window.propositionInstall = e;
      document.dispatchEvent(new Event('installation-possible'));
    });
  }

  /* 2 bis. Téléphone tenu en portrait (dans l'appli installée) : message « Tourne ton téléphone ».
     Les outils sont pensés pour l'écran projeté, donc pour le paysage. Seuls les petits écrans tactiles
     sont concernés (téléphones) : les tablettes et les ordinateurs ne voient jamais ce message. */
  if (enLigne && dansAppli) {
    const style = document.createElement('style');
    style.textContent = `
      #tourne-telephone{display:none}
      @media (orientation:portrait) and (max-width:599px) and (pointer:coarse){
        #tourne-telephone{
          display:flex;position:fixed;inset:0;z-index:2147483647;flex-direction:column;align-items:center;justify-content:center;
          gap:24px;padding:32px;text-align:center;color:#26215c;font:600 24px 'Fredoka',system-ui,sans-serif;
          background:linear-gradient(120deg,#DDEFFF 0%,#E9E3FF 50%,#FFE6F1 100%);
        }
        #tourne-telephone svg{width:120px;height:120px;animation:tourne-tel 2.4s ease-in-out infinite}
        #tourne-telephone small{display:block;margin-top:8px;font-size:17px;line-height:1.35;font-weight:500;color:#5B6785}
      }
      @keyframes tourne-tel{0%,25%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
      @media (prefers-reduced-motion:reduce){#tourne-telephone svg{animation:none;transform:rotate(-90deg)}}`;
    document.head.appendChild(style);
    const poser = () => {
      const d = document.createElement('div');
      d.id = 'tourne-telephone';
      d.setAttribute('role', 'alert');
      d.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="6" width="28" height="52" rx="6" fill="#fff" stroke="#8E6CEF" stroke-width="4"/>'
        + '<rect x="23" y="13" width="18" height="34" rx="2" fill="#E9E3FF"/><circle cx="32" cy="52" r="2.5" fill="#8E6CEF"/></svg>'
        + '<div>Tourne ton téléphone<br><small>Le cartable magique s’utilise en mode paysage.</small></div>';
      document.body.appendChild(d);
    };
    if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);
  }

  /* 3. Numéro de version dans la signature */
  function afficherVersion() {
    if (typeof APP_VERSION === 'undefined') return;
    document.querySelectorAll('.app-version').forEach(e => { e.textContent = ' – v' + APP_VERSION; });
    const vnum = document.getElementById('vnum');                    // ligne existante du calcul mental
    if (vnum) vnum.textContent = ' – v' + APP_VERSION;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afficherVersion);
  else afficherVersion();

  /* 4. Statistiques anonymes (GoatCounter, tableau de bord : https://cartable-magique.goatcounter.com)
     Rien n'est affiché dans l'appli. Aucune donnée personnelle, aucun cookie, aucun identifiant :
     - « Installation »        : quelqu'un vient d'installer l'appli ;
     - « Nouvel ordinateur »   : première ouverture de l'appli sur un ordinateur (envoyé une seule fois par ordinateur) ;
     - pages « /accueil », « /calcul-mental »… : chaque ouverture du portail ou d'un outil dans l'appli.
     Le nombre de « Nouvel ordinateur » = nombre d'ordinateurs différents qui utilisent l'appli.
     Sans internet, rien n'est envoyé (l'appli fonctionne normalement). */
  const STATS = 'https://cartable-magique.goatcounter.com/count';
  function compter(chemin, titre, evenement, quandEnvoye) {
    if (!enLigne || !navigator.onLine) return;
    const img = new Image();
    if (quandEnvoye) img.onload = quandEnvoye;
    img.src = STATS + '?p=' + encodeURIComponent(chemin) + '&t=' + encodeURIComponent(titre)
            + (evenement ? '&e=true' : '') + '&rnd=' + Math.random().toString(36).slice(2);
  }
  addEventListener('appinstalled', () => compter('installation', 'Installation de l’appli', true));
  if (enLigne && dansAppli) {
    // Une seule fois par ordinateur : la marque n'est posée qu'une fois l'envoi réussi
    let dejaCompte = false;
    try { dejaCompte = localStorage.getItem('cartable-compte') === '1'; } catch (e) {}
    if (!dejaCompte) compter('nouvel-ordinateur', 'Nouvel ordinateur', true,
      () => { try { localStorage.setItem('cartable-compte', '1'); } catch (e) {} });
    // Ouverture de la page (accueil ou outil)
    const page = surAccueil ? 'accueil' : location.pathname.replace(racine.pathname, '').replace(/\/(index\.html)?$/, '');
    compter('/' + page, document.title || page, false);
  }

  /* 4. Hors ligne et mise à jour automatique (seulement sur le site hébergé) */
  if (!enLigne || !('serviceWorker' in navigator)) return;
  const avaitVersion = !!navigator.serviceWorker.controller;          // faux à la toute première visite
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Nouvelle version installée : l'accueil se recharge tout de suite ;
    // dans un outil, on ne coupe pas l'activité : la nouvelle version servira au prochain retour à l'accueil.
    if (avaitVersion && surAccueil) location.reload();
  });
  navigator.serviceWorker.register(new URL('sw.js', racine), { scope: racine.pathname, updateViaCache: 'none' })
    .then(reg => {
      const verifier = () => { if (navigator.onLine) reg.update().catch(() => {}); };
      verifier();
      setInterval(verifier, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) verifier(); });
    })
    .catch(() => {});
})();
