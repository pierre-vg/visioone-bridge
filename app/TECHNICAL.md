# Note technique interne — Intégration VisioOne / React Native

> Destiné à l'équipe Visioglobe. Documente l'état réel du projet au 22 mai 2026.

---

## Ce qu'on a construit

Un démonstrateur complet d'intégration de VisioOne dans une app React Native via WebView. L'objectif était de valider la faisabilité du bridge postMessage et de documenter les patterns d'intégration pour les clients.

Deux dépôts :

| Dépôt | Rôle |
|---|---|
| `React Nativ/app/` | App React Native (Expo) avec le bridge |
| `visioone-bridge/` | Page HTML hébergée sur GitHub Pages, charge le SDK VisioOne |

---

## Stack retenue

| Composant | Version | Raison |
|---|---|---|
| Expo SDK | 54 | Dernière version compatible Expo Go sans build custom |
| react-native | 0.81.5 | Imposé par `expo@54.0.34/bundledNativeModules.json` |
| react | 19.1.0 | Idem |
| react-native-webview | 13.15.0 | Inclus dans bundledNativeModules → fonctionne dans Expo Go natif |
| @visioglobe/visioone | 1.0.2 | Package npm officiel, utilisé côté HTML |

**Point clé sur react-native-webview** : contrairement à l'idée reçue, ce module est dans `bundledNativeModules.json` d'Expo SDK 54. Il fonctionne donc dans Expo Go sans build Android/iOS custom. La vérification se fait en lisant `node_modules/expo/bundledNativeModules.json` — c'est la source de vérité pour les versions compatibles.

---

## Architecture du bridge

```
App React Native
├── App.tsx                     UI principale, état global
├── hooks/useVisioOne.ts        Gestion état + dispatch des commandes
├── components/
│   ├── VisioOneWebView.tsx     Wrapper react-native-webview
│   └── BridgeService.ts        Types + scripts d'injection
└── constants/config.ts         URL WebView depuis .env

          │  WebView HTTPS
          ▼

Page GitHub Pages  (pierre-vg.github.io/visioone-bridge)
├── index.html                  Logique bridge + init SDK
└── vendor/
    ├── visioone.umd.js         Bundle UMD du package npm
    └── style.css               Styles VisioOne

          │  HTTPS
          ▼

VisioMapServer (mapserver.visioglobe.com)
```

### Sens RN → WebView

`useVisioOne` appelle `webViewRef.current.sendMessage(type, payload)`.  
`VisioOneWebView` exécute `injectJavaScript()` qui dispatche un `MessageEvent('message')`.  
`BRIDGE_BOOTSTRAP_SCRIPT` (injecté avant le chargement de la page) convertit ce `MessageEvent` en `CustomEvent('rnCommand')`.  
`index.html` écoute `rnCommand` et appelle l'API VisioOne correspondante.

### Sens WebView → RN

`index.html` appelle `window.sendToRN(type, payload)` (défini par `BRIDGE_BOOTSTRAP_SCRIPT`).  
Celui-ci appelle `window.ReactNativeWebView.postMessage(json)`.  
`VisioOneWebView.onMessage` parse le JSON et appelle `onBridgeMessage`.  
`useVisioOne.handleBridgeMessage` met à jour l'état React.

---

## Chargement du SDK VisioOne côté HTML

Le SDK est distribué via npm (`@visioglobe/visioone@1.0.2`). Le build UMD (`dist/visioone.umd.cjs`) est un fichier auto-contenu de ~5 MB, mais il contient un `require('./style.css')` hérité du pipeline Vite — ce qui fait planter le chargement direct en navigateur.

**Solution retenue** :
1. Copier `dist/visioone.umd.cjs` → `vendor/visioone.umd.js` (renommage extension)
2. Copier `dist/style.css` → `vendor/style.css`
3. Charger le CSS via `<link>` dans le `<head>`
4. Définir `window.require = function() {}` avant le `<script>` UMD pour neutraliser le require CSS
5. `window.VisioOne.createVisioOne()` est ensuite disponible globalement

Le build ESM (`dist/visioone.js`) a le même problème (`import './style.css'` non supporté nativement) et se découpe en plusieurs chunks — l'UMD est plus simple à déployer statiquement.

---

## Comportements implémentés côté HTML

| Commande reçue | Action SDK |
|---|---|
| `SEARCH_POI` | Filtre `venue.pois` par `label.text` (insensible à la casse) |
| `NAVIGATE_TO` | `view.goToFloor()` + `view.goToPOI()` + sélection visuelle |
| `CREATE_ROUTE` | `venue.computeNavigation()` → `venue.createNavigationTrace()` → `view.setCurrentNavigationTrace()` |
| `SET_FLOOR` | Cherche le Floor dans `venueLayout.buildings` → `view.goToFloor()` |

| Événement émis | Déclencheur SDK |
|---|---|
| `MAP_READY` | `visioOne.createView()` résolu |
| `POI_SELECTED` | `view.addEventListener('poiclick')` — sauf si c'est un bâtiment |
| `FLOOR_CHANGED` | `view.addEventListener('currentfloorchanged')` |

**Cas particulier bâtiments** : les POIs dont l'`id` correspond à un `Building.id` dans `venueLayout.buildings` déclenchent `view.goToBuilding()` au lieu d'envoyer `POI_SELECTED`. Pas de modal côté RN dans ce cas.

**UI VisioOne** : `view.showUI = false` masque tout, puis `view.setUIPartVisible('floorSelector', true)` réaffiche uniquement le sélecteur d'étage.

---

## Ce qui a été ajusté en cours de route

### 1. Versions SDK Expo

`expo install --fix` proposait react-native 0.76.3 + react 18.3.1, qui sont les versions du projet avant mise à jour — pas celles requises par SDK 54. La source de vérité est `node_modules/expo/bundledNativeModules.json`, pas la sortie de `expo install`.

### 2. Tentative de remplacement de react-native-webview

Lors d'une erreur `TurboModuleRegistry.getEnforcing('PlatformConstants')`, on a d'abord pensé à un problème de compatibilité react-native-webview / Expo Go et tenté de le remplacer par un DOM Component + expo-router. C'était un faux diagnostic : l'erreur venait des mauvaises versions react/react-native. Une fois les bonnes versions en place, react-native-webview fonctionne parfaitement dans Expo Go.

### 3. MAP_READY jamais reçu depuis le CDN demo

L'URL CDN (`cdn.visioglobe.com/visioone/latest/apps/demo/`) est une app HTML complète qui n'appelle pas les fonctions bridge. Ajout d'un fallback `onLoad` sur le composant WebView qui émet MAP_READY dès que la page est chargée côté WebView, indépendamment de ce que fait la page.

### 4. URL CDN comme `<script src>`

Première tentative : utiliser l'URL CDN demo comme source d'un `<script>`. C'est une page HTML, pas un module JS — ça ne peut pas fonctionner. Remplacé par le package npm avec bundle UMD.

---

## Ce qui n'est pas couvert (hors scope démo)

- Authentification (token `authorizationToken` dans `LoadOptions`)
- Recherche par catégorie ou attribut
- Navigation multi-destinations (`computeNavigationMultiDestination`)
- Tracking position (`injectTrackedPosition`, `injectDeviceOrientation`)
- Internationalisation (`venue.setCurrentLocale`)
- Gestion des erreurs réseau côté SDK (retry, offline)
