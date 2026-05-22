# Getting Started

Ce guide vous permet d'intégrer VisioOne dans votre application React Native en partant de zéro.

## Prérequis

- Node.js 18+
- Expo Go installé sur votre appareil mobile (iOS ou Android)
- Une URL de page VisioOne fournie par Visioglobe (voir section [Page HTML VisioOne](#page-html-visioone))

---

## 1. Cloner et installer

```bash
git clone <votre-repo>
cd app
npm install
```

## 2. Configurer l'URL VisioOne

Créez un fichier `.env` à la racine du dossier `app/` :

```
EXPO_PUBLIC_VISIOONE_URL=https://votre-url-visioone
```

> Pour les tests, utilisez l'URL de démonstration fournie par Visioglobe.  
> Le fichier `.env` ne doit jamais être commité (il est dans `.gitignore`).

## 3. Lancer l'application

```bash
npx expo start
```

Scannez le QR code avec Expo Go. La carte se charge automatiquement.

---

## Page HTML VisioOne

La carte VisioOne s'affiche dans une WebView. Elle pointe vers une page HTML hébergée qui charge le SDK VisioOne et implémente le bridge de communication.

Visioglobe fournit une URL de démonstration prête à l'emploi. Si vous souhaitez héberger votre propre page (pour personnaliser le hash de venue ou les comportements), référez-vous au dépôt `visioone-bridge`.

### Héberger sa propre page (optionnel)

```bash
cd visioone-bridge
npm install
# Éditer HASH dans index.html
git add . && git commit -m "update" && git push origin gh-pages
```

La page est déployée automatiquement sur GitHub Pages à chaque push sur la branche `gh-pages`.

---

## Structure du projet

```
app/
├── App.tsx                    Point d'entrée UI
├── components/
│   ├── VisioOneWebView.tsx    Composant WebView + bridge
│   └── BridgeService.ts       Types et scripts du bridge
├── hooks/
│   └── useVisioOne.ts         Hook React (état + actions)
├── constants/
│   └── config.ts              Lecture de l'URL depuis .env
└── .env                       (à créer, non commité)
```

---

## Utilisation de base

```tsx
import { useVisioOne } from './hooks/useVisioOne';
import VisioOneWebView from './components/VisioOneWebView';
import { VISIOONE_URL } from './constants/config';

export default function App() {
  const { state, actions, webViewRef, handleBridgeMessage } = useVisioOne();

  return (
    <VisioOneWebView
      ref={webViewRef}
      url={VISIOONE_URL}
      onBridgeMessage={handleBridgeMessage}
    />
  );
}
```

Une fois `state.isMapReady === true`, toutes les actions sont disponibles :

```ts
actions.searchPOI('cafeteria');
actions.navigateTo('poi_id');
actions.createRoute('poi_from', 'poi_to');
actions.setFloor('floor_id');
```

Pour la référence complète des messages, voir [bridge-api.md](./bridge-api.md).
