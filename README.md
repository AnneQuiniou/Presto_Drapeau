# 🏴‍☠️🏁🏳️‍🌈 Presto Drapeau 🏳️‍🌈🏁🏴‍☠️

Finalisé !
PRESTO DRAPEAU est disponible sur HEROKU: https://prestodrapeau.herokuapp.com/

## Cahier des charges

Presto Drapeau est un jeu de connaissance et de rapidité.

Deux joueurs s'affrontent pour deviner à quel pays appartient un drapeau.

Si personne ne répond dans les 15 secondes, un nouveau drapeau apparait.

Le premier à gagner 3 manches triomphe.

---

## Démarrage

Le jeu est disponible sur HEROKU: https://prestodrapeau.herokuapp.com/

Si vous voulez jouer en local, clonez le dépôt git:

```
git clone https://github.com/AnneQuiniou/Presto_Drapeau.git
```

Une fois le dépôt cloné, installez les dépendances:

```
npm i
```

**Adaptations**

Changez la politique de cookies (la politique actuelle est faite pour Heroku et permet de jouer sur un HTTPS):

- SameSite: true,
- secure: false,

**Secret**
Créez un fichier .env qui contiendra une PRIVATE_KEY pour réaliser le token.

**Base de données locale**

- Créer en local une base de donnée ' jeu '
- Créer une collection ' drapeaux ' et une collection ' joueurs '
- Les fichiers de base à importer sont disponibles dans **/db/**

La collection de joueurs n'est pas obligatoire à importer - la base de donnée peut se créer au fur et à mesure du jeu.

**Lancement**
Une fois ces modifications faites, lancez le jeu:

```
npm run start
```

Faites en sorte d'accéder par le chemin exact choisit en local: http://127.0.0.1:3000
