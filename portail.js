/* Lien entre un outil et le portail « Le cartable magique ».
   Chargé par le portail ET par chaque outil (<script src="../portail.js">).
   - affiche le numéro de version (venu de version.js) dans la signature ;
   - affiche les boutons « Accueil » (cachés quand l'outil est ouvert seul, hors du portail) ;
   - rend l'installation obligatoire sur le site (écran « Installer ») ;
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
  if (enLigne && !dansAppli) {
    if (!surAccueil) { location.replace(racine.href); return; }
    document.documentElement.classList.add('a-installer');
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
