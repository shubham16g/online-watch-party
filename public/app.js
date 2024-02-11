import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"
const app = initializeApp({
  apiKey: "AIzaSyCDxyIHWrTNhRfuHZXKQSLW6vpYEAuDc4w",
  authDomain: "videocallaplication.firebaseapp.com",
  databaseURL: "https://videocallaplication-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "videocallaplication",
  storageBucket: "videocallaplication.appspot.com",
  messagingSenderId: "857796434966",
  appId: "1:857796434966:web:84f6b7ea53a7de3036e937",
  measurementId: "G-9ELKGRM2QQ"
});
const database = getDatabase(app);
const basePosition = ref(database, 'videos');
const hash = window.location.hash;
console.log(hash);
var room;
if (hash.length === 0 || hash === '#') {
  room = push(basePosition).key; 
} else {
  room = hash.substring(1);
}
window.location.hash = room;
const pos = ref(database, 'videos/' + room);
var user = push(pos).key;

var video = document.getElementById('localVideo');

var seeking = false;
onValue(pos, (snapshot) => {
  let json = snapshot.val();
  if (!json) return;
  if (json.user === user) return;
  let type = json.type;
  let timestamp = json.timestamp;
  if (type === "pause") {
    video.pause();
  } else if (type === "play") {
    video.play();
  }
  seeking = true;
  video.currentTime = timestamp;
});



// on video file input, set the video file in video tag
document.getElementById('fileInput').addEventListener('change', function (event) {
  var file = event.target.files[0];
  var url = URL.createObjectURL(file);
  var video = document.getElementById('localVideo');
  video.src = url;
});
// video pasuse play event with current timestamp
video.addEventListener('pause', function () {
  console.log('paused at', video.currentTime);
  if (seeking) {
    seeking = false;
    return;
  }
  set(pos, { timestamp: video.currentTime, type: "pause", user: user });
});
video.addEventListener('play', function () {
  console.log('played at', video.currentTime);
  if (seeking) {
    seeking = false;
    return;
  }
  set(pos, { timestamp: video.currentTime, type: "play", user: user });
});
// seek video event
video.addEventListener('seeked', function () {
  console.log('seeked to', video.currentTime);
  if (seeking) {
    seeking = false;
    return;
  }
  // if video is playing
  if (!video.paused) {
    return;
  }
  set(pos, { timestamp: video.currentTime, type: "seek", user: user });
});

