//NPM packages needed for game creation

// Workers (threads) are useful for performing CPU-intensive JavaScript operations
// The worker_threads module enables the use of threads that execute JavaScript in parallel.
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  threadId,
  MessageChannel,
} = require("worker_threads");

// dotenv for using secret variables
const envConfig = require('dotenv').config();

// express for development server
const express = require('express');

// Ably library for realtime messaging
const Ably = require('ably');

// p2 server side physics engine
const p2 = require('p2');

const cors = require('cors');

//new instance of express to initialize server
const app = express();
app.use(cors());

// declare env variable
const ABLY_API_KEY = process.env.ABLY_API_KEY;

//set maximum number of player for each channel
const GAME_ROOM_CAPACITY = 6;

const globalGameName = "main-game-thread";
let globalChannel;
let activeGameRooms = {};


// authenticate server with Ably
const realtime = Ably.Realtime({
  key: ABLY_API_KEY,
  echoMesages: false,
});

// creates unique id for authenticated users
const uniqueId = function () {
  return "id-" + Math.random().toString(36).substr(2, 16);
};

// set up express to server static files
app.use(express.static('public'));
// app.use(express.static('public/assets'));

// create authentication route
app.get("/auth", (req, res) => {
  const tokenParams = { clientId: uniqueId() };
  realtime.auth.createTokenRequest(tokenParams, (err, tokenRequest) => {
    if (err) {
      res
      .status(500)
      .send("Error requesting token: " + JSON.stringify(err));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(tokenRequest));
    }
  });
});

// create home route
app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.sendFile(__dirname + "/public/views/intro.html");
});

// create route to serve "gameplay" screen
app.get("/gameplay", (req, res) => {
  // res.sendFile(__dirname + "/views/index.html");
  let requestedRoom = req.query.roomCode;
  let isReqHost = req.query.isHost == "true";
  if (!isReqHost && activeGameRooms[requestedRoom]) {
    if (
      activeGameRooms[requestedRoom].totalPlayers + 1 <= GAME_ROOM_CAPACITY &&
      !activeGameRooms[requestedRoom].gameOn
    ) {
      res.sendFile(__dirname + "/public/views/index.html");
    } else {
      console.log("here");
      res.sendFile(__dirname + "/public/views/gameRoomFull.html");
    }
  } else if (isReqHost) {
    res.sendFile(__dirname + "/public/views/index.html");
  } else {
    res.sendFile(__dirname + "/public/views/gameRoomFull.html");
  }
  console.log(JSON.stringify(activeGameRooms));
});

// create route to serve "winner" screen
app.get("/winner", (req, res) => {
  res.sendFile(__dirname + "/public/views/winner.html");
});

// create route to serve "gameover" screen
app.get("/gameover", (req, res) => {
  res.sendFile(__dirname + "/public/views/gameover.html");
});

// initialize server to listen on specific port
const listener = app.listen(process.env.PORT, () => {
  console.log(`Server has it's ear to port ${listener.address().port})`)
});


// configure server to handle updates in game state
    //game has 2 channels
      //--"gameRoom" => listening for game state updates & players enter/exit the game
      //--"deadPlayerCh" => listens for players deaths in game
realtime.connection.once("connected", () => {
  globalChannel = realtime.channels.get(globalGameName);
  // subscribe to new players entering the game
  globalChannel.presence.subscribe("enter", (player) => {
    generateNewGameThread(
      player.data.isHost,
      player.data.nickname,
      player.data.roomCode,
      player.clientId
    );
  });
});

function generateNewGameThread(
  isHost,
  hostNickname,
  hostRoomCode,
  hostClientId
) {
  if (isHost && isMainThread) {
    const worker = new Worker("./server-worker.js", {
      workerData: {
        hostNickname: hostNickname,
        hostRoomCode: hostRoomCode,
        hostClientId: hostClientId,
      },
    });
    console.log(`CREATING NEW THREAD WITH ID ${threadId}`);
    worker.on("error", (error) => {
      console.log(`WORKER EXITED DUE TO AN ERROR ${error}`);
    });
    worker.on("message", (msg) => {
      if (msg.roomName && !msg.resetEntry) {
        activeGameRooms[msg.roomName] = {
          roomName: msg.roomName,
          totalPlayers: msg.totalPlayers,
          gameOn: msg.gameOn,
        };
      } else if (msg.roomName && msg.resetEntry) {
        delete activeGameRooms[msg.roomName];
      }
    });
    worker.on("exit", (code) => {
      console.log(`WORKER EXITED WITH THREAD ID ${threadId}`);
      if (code !== 0) {
        console.log(`WORKER EXITED DUE TO AN ERROR WITH CODE ${code}`);
      }
    });
  }
}



