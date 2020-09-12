let winner = localStorage.getItem("winner");
let firstRunnerUp = localStorage.getItem("firstRunnerUp");
let secondRunnerUp = localStorage.getItem("secondRunnerUp");
let totalPlayers = localStorage.getItem("totalPlayers");

document.getElementById("winner-announcement").innerHTML =
  winner + " won the game!";

if (firstRunnerUp) {
  document.getElementById("first-runnerup").innerHTML =
    firstRunnerUp + " got the highest score";
}
if (secondRunnerUp) {
  document.getElementById("second-runnerup").innerHTML =
    secondRunnerUp + " got the next highest score";
}

function getRandomRoomId() {
  return "room-" + Math.random().toString(36).substr(2, 8);
}

const replayGame = () => {
  roomCode = getRandomRoomId();
  localStorage.setItem("isHost", true);
  localStorage.setItem("roomCode", roomCode);
  window.location.replace("/gameplay?roomCode=" + roomCode + "&isHost=true")
}