"use strict";



window.addEventListener("DOMContentLoaded", () => {
  //prendre token de la session
  const mainDiv = document.querySelector("content");

  createGame();

  // Gestion websocket

  const socket = io("http://127.0.0.1:3000");

  socket.on("createPlayerDiv", (player) => {
    createPlayer(player);
  });

  socket.on("prepareGame", () => {
    prepGame();
    setUpPlayer();
    socket.emit("gameReady", "1");
  });

  socket.on("newCountry", (country) => {
    launchGame(country);
  });

  socket.on("timer", (timer) => {
    const pTimer = document.getElementById("timer");
    pTimer.innerText = timer;
  });

  socket.on("youWonSet", (info) => {
    updateMySets(info);
    showWinsAndLosses('won', '+1', info.answer);
    launchNewSet();
  });

  socket.on("otherPlayerWonSet", (info) => {
    updateOpponentSets(info);
    showWinsAndLosses('lost', '+1', info.answer);
    launchNewSet();
  });

  socket.on('noGuesses', (info) => {
    showWinsAndLosses('noGuess', 'C\'est la lose', info.answer);
    launchNewSet();
  });


  socket.on('youLoseGame', (info) => {
    updateOpponentSets(info);
    showWinsAndLosses('lost', '+1', info.answer);
    endGamePopup(info);
  })

  socket.on('youWonGame', (info) => {
    updateMySets(info);
    showWinsAndLosses('won', '+1', info.answer);
    endGamePopup(info);
  })


  socket.on("wrongAnswer", (country) => {
    const pWrongAnswer = document.getElementById("wrongAnswer");
    pWrongAnswer.innerText = `Ce n'est pas : ${country}`;
  });

  socket.on("destroyPlayer", (player) => {
    destroyPlayer(player);
  });

  socket.on('opponentDisconnected', (info) => {
    endGamePopup(info);
  });


  function createPlayer(player) {
    const divPlayers = document.getElementsByClassName("player");
    let divElement = window.document.getElementById(player.id);

    if (!divElement) {
      if (divPlayers)
        if (divPlayers.length == 2) {
          window.location.href = "/wait";
        } else {
          const newPlayer = document.createElement("div");
          newPlayer.className = "player";
          newPlayer.id = player.id;

          // gestion de l'avatar
          const avatar = document.createElement("div");
          avatar.className = "avatar";
          avatar.style.backgroundColor = player.color;

          const image = document.createElement("img");
          image.src = "img/avatar/04.png";

          avatar.appendChild(image);
          newPlayer.appendChild(avatar);

          // gestion du pseudo

          const pElementPseudo = document.createElement("p");
          pElementPseudo.innerText = player.pseudo;
          newPlayer.appendChild(pElementPseudo);

          // gestion du formulaire
          const form = document.createElement("form");
          form.method = "POST";

          const inputText = document.createElement("input");
          inputText.type = "text";
          inputText.name = "playerResponse";

          const inputSubmit = document.createElement("input");
          inputSubmit.type = "submit";
          inputSubmit.value = 'C\'est ça !';
          inputSubmit.disabled = true;

          inputSubmit.addEventListener("click", (e) => {
            e.preventDefault();
            socket.emit("playerResponse", inputText.value);
            inputText.value = '';
          });




          form.appendChild(inputText);
          form.appendChild(inputSubmit);
          newPlayer.appendChild(form);

          // div avec les manches
          const divParties = document.createElement("div");
          const pElementSets = document.createElement("p");
          const winIndicatorP = document.createElement('p');

          divParties.id = 'setsandscores';
          pElementSets.className = "sets";
          pElementSets.innerText = "Manches gagnées: 0/3";
          winIndicatorP.className = 'winIndicator';
          divParties.appendChild(pElementSets);
          divParties.appendChild(winIndicatorP);
          newPlayer.appendChild(divParties);

          // div avec toutes les parties gagnées

          mainDiv.appendChild(newPlayer);

          socket.emit("playerCreated", divPlayers.length);
        }
    }
  }

  //---------------------------------------------------------------------------------------//
  // creation de la div de jeu d'attente
  //---------------------------------------------------------------------------------------//

  function createGame() {
    const gameDiv = document.createElement("div");
    gameDiv.id = "game";

    const pElement = document.createElement("p");
    pElement.id = "wait";
    pElement.innerText = "En attente d'un deuxième joueur.";
    gameDiv.appendChild(pElement);

    const pElementTimer = document.createElement("p");
    pElementTimer.id = "timer";
    gameDiv.appendChild(pElementTimer);

    mainDiv.appendChild(gameDiv);
  }

  //---------------------------------------------------------------------------------------//
  // suppression d'un joueur
  //---------------------------------------------------------------------------------------//
  function destroyPlayer(player) {
    const divElement = window.document.getElementById(player.id);

    if (divElement) {
      divElement.parentNode.removeChild(divElement);
    }
  }

  //---------------------------------------------------------------------------------------//
  // preparation du jeu
  //---------------------------------------------------------------------------------------//

  function prepGame() {
    const waitP = document.getElementById("wait");
    waitP.innerHTML = "<strong>Le jeu va commencer dans quelques secondes.</strong><br>Preparez vos mimines et vos méninges !";
  }

  //---------------------------------------------------------------------------------------//
  // lancement d'une partie
  //---------------------------------------------------------------------------------------//
  function setUpPlayer() {
    const submitFieldsPlayer1 = document.getElementsByTagName("input")[1];

    submitFieldsPlayer1.disabled = false;
  }

  function launchGame(country) {

    const waitP = document.getElementById("wait");
    const gameDiv = document.getElementById("game");

    waitP.innerText = "Go go go!";

    const pTimer = document.getElementById("timer");
    pTimer.innerText = 15;

    if (document.getElementById('flag')) {

      document.getElementById('flag').src = `/img/drapeaux/${country.cca2}.png`;

    } else {

      const countryElement = document.createElement("img");
      countryElement.id = 'flag';
      countryElement.src = `/img/drapeaux/${country.cca2}.png`;
      gameDiv.appendChild(countryElement);

    }

    if (document.getElementById('wrongAnswer')) {

      document.getElementById('wrongAnswer').innerText = '';

    } else {

      const pWrongAnswer = document.createElement("p");
      pWrongAnswer.id = "wrongAnswer";
      gameDiv.appendChild(pWrongAnswer);

    }

    if (document.getElementById('goodAnswer')) {
      document.getElementById('goodAnswer').innerText = '';
    } else {
      const pGoodAnswer = document.createElement("p");
      pGoodAnswer.id = "goodAnswer";
      gameDiv.appendChild(pGoodAnswer);
    }
  }


  function showWinsAndLosses(gameStatus, message, rightAnswer) {
    const goodAnswer = document.getElementById('goodAnswer');
    const wrongAnswer = document.getElementById('wrongAnswer');
    wrongAnswer.innerText = '';
    goodAnswer.innerText = rightAnswer;



    const firstPlayer = document.getElementsByClassName('avatar')[0].children[0];
    const secondPlayer = document.getElementsByClassName('avatar')[1].children[0];
    const winIndicators = document.getElementsByClassName('winIndicator');

    if (gameStatus == 'won') {
      firstPlayer.src = 'img/avatar/02.png';
      secondPlayer.src = 'img/avatar/05.png';

      winIndicators[0].innerText = '+1';

    }

    if (gameStatus == 'lost') {
      firstPlayer.src = 'img/avatar/05.png';
      secondPlayer.src = 'img/avatar/02.png';

      winIndicators[1].innerText = '+1';
    }

    if (gameStatus == 'noGuess') {
      firstPlayer.src = 'img/avatar/07.png';
      secondPlayer.src = 'img/avatar/07.png';
    }


    setTimeout(() => {
      winIndicators[0].innerText = '';
      winIndicators[1].innerText = '';

      firstPlayer.src = 'img/avatar/04.png';
      secondPlayer.src = 'img/avatar/04.png';

    }, 1000);

  }

  function launchNewSet() {
    setTimeout(() => {
      socket.emit("gameReady", '1');
    }, 4000);
  }

  function updateMySets(info) {
    const monScore = document.getElementsByClassName('sets')[0];
    monScore.innerText = `Manches gagnées: ${info.newScore}/3`;
  }

  function updateOpponentSets(info) {
    const scoreDeLEnnemi = document.getElementsByClassName('sets')[1];
    scoreDeLEnnemi.innerText = `Manches gagnées: ${info.newScore}/3`;
  }

  function endGamePopup(info) {
    const popup = document.createElement('div');
    const title = document.createElement('h2');
    const replayButton = document.createElement('button');

    popup.id = 'endgame';


    const avatarEndGame = document.createElement("div");
    avatarEndGame.className = "avatar";
    avatarEndGame.style.backgroundColor = info.color;

    const imageEndGame = document.createElement("img");
    imageEndGame.src = "img/avatar/01.png";

    avatarEndGame.appendChild(imageEndGame);

    const mancheAZero = {
      newScore: 0,
    }

    if (info.disconnected) {
      imageEndGame.src = "img/avatar/03.png";
      title.innerText = 'Opposant déconnecté en cours de partie : à vous la victoire.';
      updateMySets(mancheAZero);
    } else {
      if (info.noGame) {
        imageEndGame.src = "img/avatar/06.png";
        title.innerText = 'Partie annulée';
      } else {
        title.innerText = info.winner + ' a gagné la partie !';
      }
    }
    replayButton.innerText = 'Rejouer';

    replayButton.addEventListener('click', () => {

      restart();
      updateMySets(mancheAZero);
      updateOpponentSets(mancheAZero);

    })

    popup.appendChild(avatarEndGame);
    popup.appendChild(title);
    popup.appendChild(replayButton);
    document.body.children[0].children[1].appendChild(popup);
  }


  function restart() {

    document.getElementById('endgame').remove();
    document.getElementById('flag').src = 'img/rombuswait.png';
    document.getElementById('wrongAnswer').innerText = '';
    document.getElementById('goodAnswer').innerText = '';
    document.getElementById('wrongAnswer').innerText = '';
    document.getElementById('timer').innerText = '...';
    document.getElementById('wait').innerText = 'En attente d\'un deuxième joueur.';

    socket.emit('touslesscoresazero');
    socket.emit('gameReady', 1);

  }
}


);
