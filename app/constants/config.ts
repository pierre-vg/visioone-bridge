/**
 * config.ts — Configuration centralisée de l'application.
 *
 * Pour utiliser votre propre instance VisioOne :
 * 1. Copiez .env.example → .env à la racine du dossier app/
 * 2. Renseignez EXPO_PUBLIC_VISIOONE_URL avec l'URL fournie par Visioglobe
 */

/**
 * URL de la page VisioOne hébergée par Visioglobe.
 * Configurable via la variable d'environnement EXPO_PUBLIC_VISIOONE_URL.
 *
 * Expo expose automatiquement les variables préfixées EXPO_PUBLIC_ au runtime.
 * Référence : https://docs.expo.dev/guides/environment-variables/
 */
export const VISIOONE_URL: string =
  process.env['EXPO_PUBLIC_VISIOONE_URL'] ?? 'https://[url-fournie-par-visioglobe]';
