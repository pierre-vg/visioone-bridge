# Architecture

## Vue d'ensemble

L'intégration repose sur deux parties distinctes qui communiquent via un bridge postMessage :

```
┌────────────────────────────────────────────────────┐
│              Application React Native               │
│                                                     │
│  App.tsx                                            │
│   └── useVisioOne        (état + actions)           │
│         └── VisioOneWebView                         │
│               └── react-native-webview             │
└──────────────────────┬─────────────────────────────┘
                       │  WebView (HTTPS)
                       ▼
┌────────────────────────────────────────────────────┐
│              Page HTML (GitHub Pages)               │
│      pierre-vg.github.io/visioone-bridge            │
│                                                     │
│  index.html (bridge JS + init SDK)                  │
│   └── vendor/visioone.umd.js  (@visioglobe/visioone)│
│         └── VisioMapServer (mapserver.visioglobe.com)│
└────────────────────────────────────────────────────┘
```

---

## Composants React Native

### `VisioOneWebView` (`components/VisioOneWebView.tsx`)

Wrapper autour de `react-native-webview`. Deux responsabilités :

**Recevoir des messages de la carte** via `onMessage`. Chaque message est un JSON `{ type, payload }` envoyé par `window.ReactNativeWebView.postMessage()` depuis la page HTML.

**Envoyer des commandes à la carte** via `injectJavaScript()`. La méthode `sendMessage(type, payload)` sérialise la commande et la dispatch comme `MessageEvent('message')` dans la page.

Le script `BRIDGE_BOOTSTRAP_SCRIPT` est injecté avant le chargement de la page (`injectedJavaScriptBeforeContentLoaded`). Il :
- Définit `window.sendToRN()` qui appelle `ReactNativeWebView.postMessage`
- Redirige les `MessageEvent('message')` entrants vers `CustomEvent('rnCommand')` pour que la page puisse les écouter proprement

### `useVisioOne` (`hooks/useVisioOne.ts`)

Hook React qui centralise l'état et les actions. Il expose :

| Élément | Type | Description |
|---|---|---|
| `state.isMapReady` | `boolean` | Vrai dès que la carte est initialisée |
| `state.searchResults` | `POI[] \| null` | Résultats de la dernière recherche |
| `state.selectedPOI` | `POI \| null` | POI actuellement sélectionné par l'utilisateur |
| `state.currentRoute` | `Route \| null` | Itinéraire en cours |
| `state.currentFloor` | `string \| null` | ID de l'étage affiché |
| `state.isNavigating` | `boolean` | Navigation active |
| `actions.searchPOI(query)` | fonction | Lance une recherche |
| `actions.navigateTo(poiId)` | fonction | Navigue vers un POI |
| `actions.createRoute(from, to)` | fonction | Calcule un itinéraire |
| `actions.setFloor(floorId)` | fonction | Change l'étage affiché |
| `actions.clearSelectedPOI()` | fonction | Désélectionne le POI courant |
| `webViewRef` | ref | Référence au composant WebView |
| `handleBridgeMessage` | fonction | Handler à passer à `onBridgeMessage` |

### `BridgeService` (`components/BridgeService.ts`)

Définitions TypeScript de tous les types du bridge (messages, payloads, POI, Route) et deux utilitaires :

- `BRIDGE_BOOTSTRAP_SCRIPT` : script injecté avant le chargement, installe le bridge dans la page
- `buildInjectScript(type, payload)` : génère le script à injecter pour envoyer une commande

---

## Page HTML (visioone-bridge)

La page est déployée sur GitHub Pages et chargée dans la WebView. Elle contient :

- L'initialisation du SDK : `createVisioOne()` → `loadVenue({ hash })` → `createView(container, venue)`
- Le listener `rnCommand` qui mappe chaque commande RN vers l'API VisioOne
- Les listeners SDK (`poiclick`, `currentfloorchanged`) qui appellent `sendToRN()`

Le SDK est chargé depuis `vendor/visioone.umd.js`, une copie du bundle UMD du package npm `@visioglobe/visioone`. Le CSS est chargé séparément via `<link>` et un `window.require = function() {}` neutralise l'appel `require('./style.css')` présent dans le bundle.

---

## Flux d'un message RN → WebView

```
useVisioOne.actions.searchPOI('cafeteria')
  │
  └── webViewRef.current.sendMessage('SEARCH_POI', { query: 'cafeteria' })
        │
        └── injectJavaScript(buildInjectScript(...))
              │  dispatche MessageEvent('message', { data: '{"type":"SEARCH_POI",...}' })
              ▼
        BRIDGE_BOOTSTRAP_SCRIPT listener
              │  convertit en CustomEvent('rnCommand', { detail: { type, payload } })
              ▼
        index.html: window.addEventListener('rnCommand', ...)
              │
              └── venue.pois.filter(...)  →  sendToRN('SEARCH_RESULTS', { pois: [...] })
```

## Flux d'un message WebView → RN

```
index.html: view.addEventListener('poiclick', ...)
  │
  └── sendToRN('POI_SELECTED', { poi: {...} })
        │  window.ReactNativeWebView.postMessage(json)
        ▼
  VisioOneWebView.onMessage(event)
        │  JSON.parse(event.nativeEvent.data)
        ▼
  App.tsx: handleMessage(message)
        │
        └── useVisioOne.handleBridgeMessage → setState({ selectedPOI: poi })
```

---

## Déploiement de la page HTML

La page HTML est dans le dépôt `visioone-bridge`, sur la branche `gh-pages`. GitHub Pages la sert automatiquement à `https://pierre-vg.github.io/visioone-bridge/`.

Tout push sur `gh-pages` déclenche un redéploiement (~1 minute). Il n'y a pas de CI configuré — le déploiement est manuel via `git push origin gh-pages`.
