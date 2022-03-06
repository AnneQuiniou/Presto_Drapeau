"use strict";

import express from "express";
import { MongoClient } from "mongodb";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import {
  mongoCreatePlayer,
  mongoPlayerTimeUpdate,
  mongoPlayerWin,
} from "./modules/mongoscripts.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gameInfo = {
  appPort: process.env.PORT || 3000,
  appHost: "127.0.0.1",
  key: process.env.PRIVATE_KEY,
  mongoUrl: 'mongodb://localhost:27017/',
  mongoFlags: "drapeaux",
  dataFlags: "",
  mongoPlayers: "joueurs",
  dataPlayers: "",
  currentPlayers: [],
  currentPlayersInfo: [],
  playersReady: [],
  gameInProgress: false,
  setInProgress: false,
  countryToGuess: '',
  restart: 0,
};


app.set("view engine", "pug");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser("slip"));
app.use(cors());

app.use("/css", express.static(path.join(__dirname, "/public/css")));
app.use("/js", express.static(path.join(__dirname, "/public/js")));
app.use("/img", express.static(path.join(__dirname, "/public/img")));

app.get("/", (req, res) => {
  res.render("template.pug", {
    joueurs: gameInfo.currentPlayersInfo.length,
  });
});

app.get("/top", (req, res) => {
  const mongoClient = new MongoClient(gameInfo.mongoUrl);

  mongoClient.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      const db = client.db("jeu");
      const collec = db.collection("joueurs");

      collec
        .find({})
        .sort({ wins: -1 })
        .limit(10)
        .toArray((err, data) => {
          if (err) {
            console.log(err);
          } else {
            res.render("top.pug", { players: data });
            client.close();
          }
        });
    }
  });
});

app.post("/", (req, res) => {
  const params = req.body;


  params.pseudo = params.pseudo.toUpperCase();

  // le pseudo est-il utilisé actuellement?
  if (gameInfo.currentPlayers.indexOf(params.pseudo) != -1) {

    res.render("template.pug", {
      warning: "Ce pseudo est déjà utilisé actuellement.",
    });

  }
  else {
    // le pseudo n'est pas utilisé
    // créer un token

    const token = jwt.sign({ data: params.pseudo }, gameInfo.key);

    const cookieOptions = {
      maxAge: 1000 * 60 * 15, // expire after 15 minutes
      sameSite: 'lax',
      secure: true,
      signed: true,
    };

    res.cookie("access_token", token, cookieOptions);

    // ajouter le joueur dans le tableau des joueurs actuels
    gameInfo.currentPlayers.push(params.pseudo);

    const mongoClient = new MongoClient(gameInfo.mongoUrl);

    mongoClient.connect((err, client) => {
      if (err) {
        console.log(err);
      } else {
        const db = client.db("jeu");
        const collec = db.collection("joueurs");

        collec.findOne({ pseudo: params.pseudo }).then(
          (data) => {
            // vérifier si le joueur existe dans la base de donnée et le créer si ce n'est pas le cas
            if (data == null) {
              mongoCreatePlayer({
                pseudo: params.pseudo,
                token: token,
                wins: 0,
                time: 0,
              });

              gameInfo.currentPlayersInfo.push({
                access_token: token,
                pseudo: params.pseudo,
                wins: 0,
                color: params.color,
              });

              res.render("template.pug", { token: true });
              client.close();
            } else {

              gameInfo.currentPlayersInfo.push({
                access_token: token,
                pseudo: params.pseudo,
                wins: data.wins,
                color: params.color,
              });

              res.render("template.pug", { token: true });
              client.close();
            }
          },
          (err) => {
            console.log(err);
          }
        );
      }
    });
  }
});

//GESTION DES ROUTES FAUSSES ETC

app.get("*", (req, res, next) => {
  const error = new Error();
  error.message = "Page demandée non autorisée";
  next(error);
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.render("404.pug", {
    error: err.message,
  });
});

// lancement de l'app

const httpServer = app.listen(gameInfo.appPort, gameInfo.appHost, () => {
  console.log(
    `┌ ༼ ◉ _ ◉  ༽ ┐ ---------- Server is running on ${gameInfo.appHost}:${gameInfo.appPort} -- I am watching, master ---------- ┌ ༼ ◉ _ ◉  ༽ ┐ `

  );
});

// ---------------------------------------------------------------------------------------------------------------------------//
// --------------------------------------------- Socket IO server ------------------------------------------------------------//
// ---------------------------------------------------------------------------------------------------------------------------//

const ioServer = new Server(httpServer);
const allPlayers = [];


ioServer.on("connection", (socket) => {
  const cookie = JSON.stringify(socket.handshake.headers.cookie);
  const cookiePure = cookie.split("access_token=s%3A");
  const cookieSplit = cookiePure[1].split(".");
  const token = cookieSplit.slice(0, 3).join(".");

  const myPlayer = {};

  gameInfo.currentPlayersInfo.forEach((player) => {
    if (player.access_token == token) {
      myPlayer.id = socket.id;
      player.id = myPlayer.id;
      myPlayer.pseudo = player.pseudo;
      myPlayer.color = player.color;
      myPlayer.wins = player.wins;
      myPlayer.access_token = token;
      myPlayer.sets = 0;
      player.start = new Date();
    }
  });

  allPlayers[myPlayer.id] = myPlayer;

  ioServer.emit("createPlayerDiv", myPlayer);

  for (let element in allPlayers) {
    const newPlayer = allPlayers[element];
    ioServer.emit("createPlayerDiv", newPlayer);
  }

  socket.on("playerCreated", (info) => {
    if (info == 2) {
      ioServer.emit("prepareGame", "Go");
    }
  });


  socket.on("gameReady", (info) => {
    if (gameInfo.playersReady.indexOf(socket.id) == -1) {
      gameInfo.playersReady.push(socket.id);


      if (gameInfo.playersReady.length > 1) {
        const randomNumber = Math.floor(Math.random() * 250);
        gameInfo.gameInProgress = true;


        const mongoClient = new MongoClient(gameInfo.mongoUrl);

        mongoClient.connect((err, client) => {
          if (err) {
            console.log(err);
          } else {
            const db = client.db("jeu");
            const collec = db.collection("drapeaux");

            collec.find({}).toArray((err, data) => {
              if (err) {
                console.log(err);
                client.close();
              } else {
                client.close();
                gameInfo.countryToGuess = data[randomNumber];
                gameInfo.countryToGuess.cca2 = gameInfo.countryToGuess.cca2.toLowerCase();
                gameInfo.setInProgress = true;

                setTimeout(() => {
                  ioServer.emit("newCountry", gameInfo.countryToGuess);
                  let timer = 15;
                  let timerRemove = setInterval(() => {
                    ioServer.emit("timer", timer);


                    if (!gameInfo.gameInProgress || !gameInfo.setInProgress) {
                      clearInterval(timerRemove);
                      gameInfo.playersReady = [];
                    }

                    if (timer == 0) {
                      clearInterval(timerRemove);
                      gameInfo.setInProgress = false;
                      gameInfo.playersReady = [];
                      ioServer.emit('noGuesses', {
                        answer: gameInfo.countryToGuess.game[0]
                      })
                    }

                    timer--;
                  }, 1000);
                }, 1000);
              }
            });
          }
        });
      }
    }
  });

  socket.on('touslesscoresazero', () => {
    for (let player in allPlayers) {
      allPlayers[player].sets = 0;
    }
  })

  socket.on("playerResponse", (guess) => {
    if (gameInfo.setInProgress) {
      const transformedGuess = guess.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "").toUpperCase().replaceAll(' ', '');

      if (gameInfo.countryToGuess.game.indexOf(transformedGuess) != -1) {
        gameInfo.setInProgress = false;

        allPlayers[socket.id].sets++;
        gameInfo.playersReady = [];

        if (allPlayers[socket.id].sets >= 3) {
          gameInfo.gameInProgress = false;

          for (let player in allPlayers) {
            if (socket.id != player) {

              ioServer.to(player).emit("youLoseGame", {
                winner: allPlayers[socket.id].pseudo,
                color: allPlayers[socket.id].color,
                answer: gameInfo.countryToGuess.game[0],
                newScore: allPlayers[socket.id].sets
              });

            } else {
              allPlayers[player].wins++;
              mongoPlayerWin(allPlayers[player]);

              ioServer.to(player).emit("youWonGame", {
                winner: allPlayers[socket.id].pseudo,
                color: allPlayers[socket.id].color,
                answer: gameInfo.countryToGuess.game[0],
                newScore: allPlayers[socket.id].sets
              });

            }
          }

        } else {
          for (let player in allPlayers) {
            if (socket.id != player) {

              ioServer.to(player).emit("otherPlayerWonSet", {
                answer: gameInfo.countryToGuess.game[0],
                newScore: allPlayers[socket.id].sets
              });

            } else {
              ioServer.to(player).emit("youWonSet", {
                answer: gameInfo.countryToGuess.game[0],
                newScore: allPlayers[socket.id].sets
              });
            }
          }
        }
      }
      else {
        gameInfo.setInProgress = true;
        ioServer.emit("wrongAnswer", guess);
      }
    }
  });


  socket.on('restart', (info) => {

    gameInfo.restart += info;

    if (gameInfo.restart == 2) {
      for (let player in allPlayers) {
        allPlayers[player].sets = 0;

        ioServer.to(player).emit('updateScores');

      };
    }
  });

  socket.on("disconnect", () => {


    ioServer.emit("destroyPlayer", myPlayer);

    if (gameInfo.gameInProgress) {
      for (let player in allPlayers) {
        if (socket.id != player && allPlayers[player].sets != 0) {
          ioServer.to(player).emit('opponentDisconnected', {
            winner: allPlayers[player].pseudo,
            color: allPlayers[player].color,
            answer: gameInfo.countryToGuess.game[0],
            disconnected: true,
          });

          mongoPlayerWin(allPlayers[player].pseudo);
        }

        if (socket.id != player && allPlayers[player].sets == 0) {
          ioServer.to(player).emit('opponentDisconnected', {
            winner: allPlayers[player].pseudo,
            color: allPlayers[player].color,
            answer: gameInfo.countryToGuess.game[0],
            noGame: true,
          });

        }

        if (socket.id == player) {
          for (let y = 0; y < gameInfo.currentPlayers.length; y++) {
            if (gameInfo.currentPlayers[y] == allPlayers[player].pseudo) {
              gameInfo.currentPlayers.splice(y, 1);
            }
          }
        }

      }
      gameInfo.gameInProgress = false;
      gameInfo.setInProgress = false;
    }

    gameInfo.currentPlayersInfo.forEach((player) => {
      if (player.id == socket.id) {
        player.end = Math.abs(new Date() - player.start);
        mongoPlayerTimeUpdate(player);
      }
    });

    gameInfo.currentPlayers = gameInfo.currentPlayers.filter(
      (player) => {
        return player != myPlayer.pseudo;
      }
    );


    gameInfo.currentPlayersInfo = gameInfo.currentPlayersInfo.filter(
      (player) => {
        return player.id != myPlayer.id;
      }
    );

    delete gameInfo.playersReady[socket.id];

    delete allPlayers[myPlayer.id];
  });
});
