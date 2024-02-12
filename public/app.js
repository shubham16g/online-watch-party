import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"

const showDOM = (id) => {
  document.getElementById(id).style.display = 'block';
}
const hideDOM = (id) => {
  document.getElementById(id).style.display = 'none';
}

const fetchRoomDetails = async (room) => {
  const roomDetails = ref(database, 'videos/' + room);
  try {
    let snapshot = await get(roomDetails);
    if (snapshot.exists() && snapshot.hasChild("details")) {
      let createdAt = snapshot.val().details.createdAt;
      let currentTimestamp = new Date().getTime();
      if (currentTimestamp - createdAt > 24 * 60 * 60 * 1000 || createdAt == null) {
        location.hash = '';
        throw "Room expired. Please create a new room.";
      }
      return snapshot.val();
    } else {
      location.hash = '';
      return null;
    }
  } catch (error) {
    location.hash = '';
    console.error(error);
    throw error;
  }
}

const generateOrGetRoom = () => {
  const basePosition = ref(database, 'videos');
  const hash = window.location.hash;
  var room;
  console.log(hash);
  if (hash.length === 0 || hash === '#') {
    room = push(basePosition).key;
  } else {
    room = hash.substring(1);
  }
  // window.location.hash = room;
  return room;
}

const generateUser = (room) => {
  return push(ref(database, 'videos/' + room)).key;
}

const createRoomForStreamLink = (room, url) => {
  let currentTimestamp = new Date().getTime();
  set(ref(database, 'videos/' + room + '/details'), { type: "link", url: url, createdAt: currentTimestamp }).then(() => {
    console.log('Room created for stream link');
    location.hash = room;
    video.src = url
    hideDOM('stream-link')
    hideDOM('choose-video')
    showDOM('share-button')
  }).catch((error) => {
    alert("Error while creating room for stream link");
  });
}

const createRoomForFile = (room, path) => {
  let currentTimestamp = new Date().getTime();
  set(ref(database, 'videos/' + room + '/details'), { type: "file", path: path, createdAt: currentTimestamp }).then(() => {
    console.log('Room created for file');
    video.src = path
    location.hash = room;
    hideDOM('stream-link')
    hideDOM('choose-video')
    showDOM('share-button')
  }).catch((error) => {
    alert("Error while creating room for file");
  });
}

//  start form here
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
const room = generateOrGetRoom();
const user = generateUser(room);
fetchRoomDetails(room).then((val) => {
  if (!val) {
    showDOM('stream-link')
    showDOM('choose-video')
    return;
  }
  let details = val.details;
  if (details.type === "link") {
    video.src = details.url;
    hideDOM('stream-link')
    hideDOM('choose-video')
    showDOM('share-button')
  } else {
    hideDOM('stream-link')
    showDOM('choose-video')
  }
  // room already exists
}).catch((error) => {
  alert(error);
});
// setup complete

var video = document.getElementById('localVideo');
const streamInput = document.getElementById('streamInput');

// on input stream link
document.getElementById('streamInputButton').addEventListener('click', function (event) {
  console.log(streamInput.value);
  // todo validate url.
  createRoomForStreamLink(room, streamInput.value);
});

// on video file input, set the video file in video tag
document.getElementById('fileInput').addEventListener('change', function (event) {
  var file = event.target.files[0];
  var path = URL.createObjectURL(file);
  createRoomForFile(room, path);
});

document.getElementById('share-button').addEventListener('click', function (event) {
  var url = window.location.href;
  // copy to clipboard
  navigator.clipboard.writeText(url).then(function () {
    alert('Room link copied to clipboard');
  }, function (err) {
    alert('Error while copying room link to clipboard');
  });
});


const pos = ref(database, 'videos/' + room + "/state");
var seeking = false;
onValue(pos, (snapshot) => {
  if (!snapshot.exists()) return;
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

