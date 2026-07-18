# Autorisations par application

DailyMe utilise un identifiant stable par application, par exemple
`athletic-performance`. Le document Firestore `users/{uid}` contient le tableau
`allowedApps` avec les identifiants autorises.

Les administrateurs sont identifies par l'existence du document
`admins/{uid}`. Ce document ne peut pas etre cree depuis le navigateur : il faut
le creer depuis la console Firebase. Un administrateur voit toutes les apps et
peut modifier `allowedApps` depuis `apps/portal/admin.html`.

Les profils utilisateurs sont crees automatiquement a leur premiere connexion.
Un nouveau profil ne possede initialement aucune application.

Le seul ecran de connexion est `apps/portal/login.html`. Une sous-application
ouverte directement redirige vers ce login, puis revient a son URL initiale une
fois la session Firebase ouverte.

## Ajouter une application

1. Ajouter l'app dans `apps/<app-id>/`.
2. Ajouter une entree dans `apps/portal/app-catalog.js`.
3. Pour une app statique, ajouter `data-app-id="<app-id>"` sur `<html>` et
   charger `firebase-config.js` puis `auth-guard.js`.
4. Pour une app React, entourer ses routes avec
   `<RequireAuth appId="<app-id>" ... />`.
5. Proteger les collections Firestore, les fichiers Storage ou les API de l'app
   avec le meme identifiant. Le garde dans le navigateur sert a l'interface ;
   les regles Firebase assurent la protection des donnees.
6. Ajouter la copie ou le build de l'app dans `.github/workflows/deploy-pages.yml`
   si elle n'est pas deja incluse dans l'artefact GitHub Pages.

Les fichiers HTML, CSS et JavaScript publies sur GitHub Pages restent publics.
Firebase protege les donnees et les actions, pas le telechargement des fichiers
statiques du site.
