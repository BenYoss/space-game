let winner = localStorage.getItem("winner");
let firstRunnerUp = localStorage.getItem("firstRunnerUp");
let secondRunnerUp = localStorage.getItem("secondRunnerUp");
let totalPlayers = localStorage.getItem("totalPlayers");

document.getElementById("winner-announcement").innerHTML =
  winner + " won the game!";

if (firstRunnerUp) {
  document.getElementById("first-runnerup").innerHTML =
    firstRunnerUp + " is the first runner up";
}
if (secondRunnerUp) {
  document.getElementById("second-runnerup").innerHTML =
    secondRunnerUp + " is the second runner up";
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