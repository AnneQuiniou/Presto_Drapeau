import { MongoClient } from "mongodb";


// ---------------------------------------------------------------------------------------------------------------------------//
// --------------------------------------- Insert ONE player into Mongo -----------------------------------------------------//
// ---------------------------------------------------------------------------------------------------------------------------//

export function mongoCreatePlayer(player) {
  const mongoClient = new MongoClient(
    "mongodb://localhost:27017/"
  );

  mongoClient.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      const db = client.db("jeu");
      db.collection("joueurs").insertOne(player, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log(result + " was inserted into Mongo DB");
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------------------//
// --------------------------------------- update win counts for a player -----------------------------------------------------//
// ---------------------------------------------------------------------------------------------------------------------------//

export function mongoPlayerWin(player) {
  const mongoClient = new MongoClient(
    "mongodb://localhost:27017/"
  );

  mongoClient.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      const db = client.db("jeu");
      const collec = db.collection("joueurs");


      collec.updateOne(
        { pseudo: player.pseudo },
        { $inc: { wins: 1 } },
        (err, res) => {
          if (err) {
            console.log(err);
            client.close();
          } else {
            console.log(player.pseudo + " updated");
            client.close();
          }
        }
      );
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------------------//
// --------------------------------------- update time spent  for a player -----------------------------------------------------//
// ---------------------------------------------------------------------------------------------------------------------------//

export function mongoPlayerTimeUpdate(player) {
  const mongoClient = new MongoClient(
    "mongodb://localhost:27017/");

  mongoClient.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      const db = client.db("jeu");
      const collec = db.collection("joueurs");

      collec.updateOne(
        { pseudo: player.pseudo },
        { $inc: { time: player.end } },
        (err, res) => {
          if (err) {
            console.log(err);
            client.close();
          } else {
            console.log(player.pseudo + " updated");
            client.close();
          }
        }
      );
    }
  });
}
