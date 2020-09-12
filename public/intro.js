let nickname = "";
let roomCode = "";

function hostNewGame() {
  localStorage.clear();
  let nicknameInput = document.getElementById("create-nickname");
  nickname = nicknameInput.value;
  roomCode = getRandomRoomId();
  localStorage.setItem("isHost", true);
  localStorage.setItem("nickname", nickname);
  localStorage.setItem("roomCode", roomCode);
  window.location.replace("/gameplay?roomCode=" + roomCode + "&isHost=true");
}

function joinRoom() {
  localStorage.clear();
  let nicknameInput = document.getElementById("join-nickname");
  nickname = nicknameInput.value;
  roomCode = document.getElementById("join-room-code").value;
  localStorage.setItem("isHost", false);
  localStorage.setItem("nickname", nickname);
  localStorage.setItem("roomCode", roomCode);
  window.location.replace("/gameplay?roomCode=" + roomCode + "&isHost=false");
}

// creates a random number to be used as room number
function getRandomRoomId() {
  return "room-" + Math.random().toString(36).substr(2, 8);
}

// restarts the game once player has died or won
const replayGame = () => {
  roomCode = getRandomRoomId();
  localStorage.setItem("isHost", true);
  // localStorage.setItem("nickname", nickname);
  localStorage.setItem("roomCode", roomCode);
  window.location.replace("/gameplay?roomCode=" + roomCode + "&isHost=true")
}