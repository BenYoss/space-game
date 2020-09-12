// import {getAvatarA, getAvatarB, getAvatarC} from 'assets.js';
// const avatarB = require('assets.js');
// const avatarC = require('assets.js');
// const avatarA = require('assets.js');
let avatarB = '/home/james/space-invaders/public/assets/avatarB.png';
let avatarA = '/home/james/space-invaders/public/assets/avatarA.png';
let avatarC = '/home/james/space-invaders/public/assets/avatarC.png';

let globalChannel;
let myClientId;
let myChannel;
let myChannelName;
let gameOn = false;
let players = {};
let totalPlayers = 0;
let latestShipPosition;
let bulletThatShotMe;
let bulletThatShotSomeone;
let bulletOutOfBounds = "";
let amIalive = false;
let game;
let myGameRoomName;
let myGameRoomCh;

// const BASE_SERVER_URL = "http://localhost:8080";
const myNickname = localStorage.getItem("nickname");
const myGameRoomCode = localStorage.getItem("roomCode");
const amIHost = localStorage.getItem("isHost");
const startGameBtn = document.getElementById("btn-startgame");

document.getElementById("room-code").innerHTML =
  "Other players can join using the code: " + myGameRoomCode;

//connects to Ably Realtime channelS for our game
const realtime = Ably.Realtime({
  authUrl: '/auth',
});

// show modal
if(amIHost === 'true'){
  document.querySelector('.bg-modal').getElementsByClassName.display = 'flex';
  document.getElementById("game-link").innerHTML =
    "Invite your friends to join using the code: <br/>" + myGameRoomCode;
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".bg-modal").style.display = "none";
  });
}

// copies the users inputted text
function copyGameCode() {
  navigator.clipboard.writeText(myGameRoomCode);
  let copyButton = document.getElementById("copy-button");
  copyButton.style.backgroundColor = "white";
  copyButton.style.color = "black";
  copyButton.style.border = "2px solid black";
  copyButton.innerHTML = "Copied!";
}

// once connected to Ably, instantiate channels and launch the game
realtime.connection.once("connected", () => {
  myClientId = realtime.auth.clientId;
  myGameRoomName = myGameRoomCode + ":primary";
  myChannelName = myGameRoomCode + ":clientChannel-" + myClientId;
  myGameRoomCh = realtime.channels.get(myGameRoomName);
  myChannel = realtime.channels.get(myChannelName);

  if (amIHost == "true") {
    const globalGameName = "main-game-thread";
    globalChannel = realtime.channels.get(globalGameName);
    myGameRoomCh.subscribe("thread-ready", (msg) => {
      myGameRoomCh.presence.enter({
        nickname: myNickname,
        isHost: amIHost,
      });
    });
    globalChannel.presence.enter({
      nickname: myNickname,
      roomCode: myGameRoomCode,
      isHost: amIHost,
    });
    startGameBtn.style.display = "inline-block";
  } else if (amIHost != "true") {
    myGameRoomCh.presence.enter({
      nickname: myNickname,
      isHost: amIHost,
    });
    startGameBtn.style.display = "none";
  }
  game = new Phaser.Game(config);

});

// starts a new game of space invaders
const startGame = () => {
  myChannel.publish("start-game", {
    start: true,
  });
}


//  primary game scene
class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  // function loads assets to game
    //spritesheet("asset identifer", "path to asset", {asset dimensions} )
  preload(){
    this.load.spritesheet(
      "avatarAanimated", //asset identifer, title
      "https://media1.tenor.com/images/7790f58030c03088ccf906477c1d9daa/tenor.gif?itemid=4992695",
      {
        frameWidth: 48,
        frameHeight: 32
      }
    );
    this.load.spritesheet(
      "avatarBanimated",
      "https://i.gifer.com/PCTg.gif",
      {
        frameWidth: 48,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "avatarCanimated",
      "https://www.awwwards.com/awards/gallery/2016/02/space-invader.gif",
      {
        frameWidth: 48,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "ship",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2FShip%402x.png?v=1589228730678",
      {
        frameWidth: 60,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "bullet",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fbullet.png?v=1589229887570",
      {
        frameWidth: 48,
        frameHeight: 48,
      }
    );
    this.load.spritesheet(
      "explosion",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fexplosion57%20(2).png?v=1589491279459",
      {
        frameWidth: 48,
        frameHeight: 48,
      }
    );
    this.load.audio(
      "move1",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Ffastinvader1.mp3?v=1589983955301"
    );
    this.load.audio(
      "move2",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Ffastinvader2.mp3?v=1589983959381"
    );
    this.load.audio(
      "move3",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Ffastinvader3.mp3?v=1589983969580"
    );
    this.load.audio(
      "move4",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Ffastinvader4.mp3?v=1589983973991"
    );
    this.load.audio(
      "myDeath",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fexplosion.mp3?v=1589984025058"
    );
    this.load.audio(
      "opponentDeath",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Finvaderkilled.mp3?v=1589983981160"
    );
    this.load.audio(
      "shoot",
      "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fshoot.mp3?v=1589983990745"
    );
  }

  // creates variables, define game animations, define game sounds, display assets in game
  //triggered on initial game load
  create(){
    // client-side variable to represent game-state
    this.avatars = {};
    this.visibleBullets = {};
    this.ship = {};
    this.cursorKeys = this.input.keyboard.createCursorKeys();

    //method to create explosion animations - "key" used to play this animation
    this.anims.create({
      key: "explode",
      frames: this.anims.generateFrameNumbers("explosion"),
      frameRate: 20,
      repeat: 0,
      hideOnComplete: true
    });

    this.anims.create({
      key: "animateA",
      frames: this.anims.generateFrameNumbers("avatarAanimated"),
      frameRate: 2,
      repeat: -1,
    });

    this.anims.create({
      key: "animateB",
      frames: this.anims.generateFrameNumbers("avatarBanimated"),
      frameRate: 2,
      repeat: -1,
    });

    this.anims.create({
      key: "animateC",
      frames: this.anims.generateFrameNumbers("avatarCanimated"),
      frameRate: 2,
      repeat: -1,
    });

    this.soundLoop = 0;
    this.shootSound = this.sound.add('shoot');
    this.move1 = this.sound.add('move1');
    this.move2 = this.sound.add('move2');
    this.move3 = this.sound.add('move3');
    this.move4 = this.sound.add('move4');
    this.myDeathSound = this.sound.add('myDeath');
    this.opponentDeathSound = this.sound.add('opponentDeath');
    this.movingSounds = [this.move1, this.move2, this.move3, this.move4];

    setInterval(() => {
      this.movingSounds[this.soundLoop].play();
      this.soundLoop++;
      if (this.soundLoop === 4) {
        this.soundLoop = 0;
      }
    }, 500);

    // function subscribes client to game-sate event in gameRoom channel
      //when game-state update received client-side variables are updated in turn
    myGameRoomCh.subscribe("game-state", (msg) => {
      if (msg.data.gameOn) {
        gameOn = true;
        if (msg.data.shipBody["0"]) {
          latestShipPosition = msg.data.shipBody["0"];
        }
        if (msg.data.bulletOrBlank != "") {
          let bulletId = msg.data.bulletOrBlank.id;
          this.visibleBullets[bulletId] = {
            id: bulletId,
            y: msg.data.bulletOrBlank.y,
            toLaunch: true,
            bulletSprite: "",
          };
        }
        if (msg.data.killerBulletId) {
          bulletThatShotSomeone = msg.data.killerBulletId;
        }
      }
      players = msg.data.players;
      totalPlayers = msg.data.playerCount;
    });

    // function subscribes client to game-over event in gameRoom channel
      // when a game-over update is received, leader-board info is stored in local storage
      // unsubscribe client from all channels and switch to a new webpage b/c won or died
      myGameRoomCh.subscribe("game-over", (msg) => {
      gameOn = false;
      localStorage.setItem("totalPlayers", msg.data.totalPlayers);
      localStorage.setItem("winner", msg.data.winner);
      localStorage.setItem("firstRunnerUp", msg.data.firstRunnerUp);
      localStorage.setItem("secondRunnerUp", msg.data.secondRunnerUp);
      myGameRoomCh.detach();
      myChannel.detach();
      if (msg.data.winner == "Nobody") {
        window.location.replace('/gameover');
      } else {
        window.location.replace('/winner');
      }
     });
  }

  // update attributes of various game  objects per game even/logic
  //executed continuously during  game play
  update(){
    // move the existing game objects in accordance with the latest info
    if (gameOn) {
      if (this.ship.x) {
        this.ship.x = latestShipPosition;
      } else {
        this.ship = this.physics.add
          .sprite(latestShipPosition, config.scale.height - 32, "ship")
          .setOrigin(0.5, 0.5);
        this.ship.x = latestShipPosition;
      }
       // create and update the position of the bullets
      for (let item in this.visibleBullets) {
        if (this.visibleBullets[item].toLaunch) {
          this.visibleBullets[item].toLaunch = false;
          this.createBullet(this.visibleBullets[item]);
        } else {
          this.visibleBullets[item].bulletSprite.y -= 20;
          if (
            this.visibleBullets[item].bulletSprite.y < 0 ||
            this.visibleBullets[item].id == bulletThatShotSomeone
          ) {
            this.visibleBullets[item].bulletSprite.destroy();
            delete this.visibleBullets[item];
          }
        }
      }
    }

    for (let item in this.avatars) {
      if (!players[item]) {
        this.avatars[item].destroy();
        delete this.avatars[item];
      }
    }

    for (let item in players) {
      let avatarId = players[item].id;
      if (this.avatars[avatarId] && players[item].isAlive) {
        this.avatars[avatarId].x = players[item].x;
        this.avatars[avatarId].y = players[item].y;
        if (avatarId == myClientId) {
          // update the score
          document.getElementById("score").innerHTML =
            "Score: " + players[item].score;
        }
      } // create new avatars for the newly joined players,
      else if (!this.avatars[avatarId] && players[item].isAlive) {
        if (players[item].id != myClientId) {
          let avatarName =
            "avatar" +
            players[item].invaderAvatarType +
            players[item].invaderAvatarColor;
          this.avatars[avatarId] = this.physics.add
            .sprite(players[item].x, players[item].y, avatarName)
            .setOrigin(0.5, 0.5);
          this.avatars[avatarId].setCollideWorldBounds(true);
          // flash the join and leave updates
          document.getElementById("join-leave-updates").innerHTML =
            players[avatarId].nickname + " joined";
          setTimeout(() => {
            document.getElementById("join-leave-updates").innerHTML = "";
          }, 2000);
        } else if (players[item].id == myClientId) {
          let avatarName = "avatar" + players[item].invaderAvatarType;
          this.avatars[avatarId] = this.physics.add
            .sprite(players[item].x, players[item].y, avatarName)
            .setOrigin(0.5, 0.5);
          this.avatars[avatarId].setCollideWorldBounds(true);
          amIalive = true;
        }
      } // kill avatars of any player that has died
      else if (this.avatars[avatarId] && !players[item].isAlive) {
        this.explodeAndKill(avatarId);
      }
    }
    // check if the left or right key was pressed
    // if yes, publish that info to Ably.
    this.publishMyInput();
  }

// triggers the explosion sequence when player dies
  explodeAndKill(deadPlayerId) {
    this.avatars[deadPlayerId].disableBody(true, true);
    if (deadPlayerId == myClientId) {
      this.myDeathSound.play();
    } else {
      this.opponentDeathSound.play();
    }
    // create a new instance of the Explosion class
    let explosion = new Explosion(
      this,
      this.avatars[deadPlayerId].x,
      this.avatars[deadPlayerId].y
    );
    // destroy avatar of dead player
    delete this.avatars[deadPlayerId];
    document.getElementById("join-leave-updates").innerHTML =
      players[deadPlayerId].nickname + " died";
    setTimeout(() => {
      document.getElementById("join-leave-updates").innerHTML = "";
    }, 2000);
  }

  // publish user input to the game server
  publishMyInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left) && amIalive) {
      myChannel.publish("pos", {
        keyPressed: "left",
      });
    } else if (
      Phaser.Input.Keyboard.JustDown(this.cursorKeys.right) &&
      amIalive
    ) {
      myChannel.publish("pos", {
        keyPressed: "right",
      });
    }
  }

  // we add a new bullet object according to the latest position of the ship
  // add this bullet to the visibleBullets associative array
  createBullet(bulletObject) {
    let bulletId = bulletObject.id;
    this.visibleBullets[bulletId].bulletSprite = this.physics.add
      .sprite(this.ship.x + 23, bulletObject.y, "bullet")
      .setOrigin(0.5, 0.5);
      this.shootSound.play();
    //add an overlap callback if the current player is still alive
    if (amIalive) {
      if (
        // keep track of the overlap of the two game objects overlapping
        this.physics.add.overlap(
          this.visibleBullets[bulletId].bulletSprite,
          this.avatars[myClientId],
          this.publishMyDeathNews,
          null,
          this
        )
      ) {
        bulletThatShotMe = bulletId;
      }
    }
  }

  // triggered when bullet object overlaps with the current player's avatar
  // meaning the player has been shot
  publishMyDeathNews(bullet, avatar) {
    if (amIalive) {
      // publish player death info to the server to update the game state
      myChannel.publish("dead-notif", {
        killerBulletId: bulletThatShotMe,
        deadPlayerId: myClientId,
      });
    }
    amIalive = false;
  }

};

//game configuration object
const config = {
  type: Phaser.AUTO,
  backgroundColor: "#FFFFF",
  scale: {
    parent: "gameContainer", // indicate where to load game
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1400, //size of game canvas
    height: 700, //size of game canvas
  },
  scene: [GameScene], //array of scenes to display in game, we have only one
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

