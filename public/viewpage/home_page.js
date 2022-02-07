import * as Auth from '../controller/auth.js'
import * as Elements from './elements.js'
import * as Constants from '../model/constants.js'
import {
 attachRealtimeListener, initFirestoreDocs, updateTimeData,
} from '../controller/firestore_controller.js';

export let timeDataDoc = null;

let startAlarmButton
let resetAlarmButton
let alarmDropDwn
let currentTime
let myTimer
let myAlarm

export function home_page() {
  if (!Auth.currentUser) {
    Elements.root.innerHTML = `
        <h3>Not Signed In</h3>
    `;
    return;
  }

  let html = '<span id="my-time" class="d-flex justify-content-center time-header"></span>';
  html += `
  <div class="container">
    <div class="instruction-div">
      <B>My Timer</B><BR>
      1)Select a time from drop down menu<BR>
      2)Press Start<BR>
      3)**OPTIONAL** Select Reset to start over<br>
      4)Watch your timer count down
    </div>
  </div>
  <div class="container">
    <div class="input-div time-header">
      <form>
        <label for="alarm-dropdox" class="time-header">Set alarm for:</label>
        <select id="alarm-selection">
          <option value="no-alarm"></option>
          <option value="10">10 seconds</option>
          <option value="15">15 seconds</option>
          <option value="20">20 seconds</option>
          <option value="30">30 seconds</option>
        </select>
        <br>
      </form>
      <button id="button-start-alarm" class="btn">START</button>
      <button id="button-reset-alarm" type="input" class="btn">RESET</button>
      <div>
        <label class="time-header">Timer:</label>
        <p id="timer-content"></p>
      </div>
    </div>
  </div>
  `;

  Elements.root.innerHTML = html;

  var span = document.getElementById('my-time');

  function time() {
    currentTime = new Date();
    var s = currentTime.getSeconds();
    var m = currentTime.getMinutes();
    var h = currentTime.getHours();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    span.textContent =
      ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2) + " " + tz;
  }
  
  setInterval(time, 1000);

  initFirestoreDocs();

  timeDataDoc = attachRealtimeListener(Constants.COLLECTION,
    Constants.TIMEDATA, timeListener);
  startAlarmButton = document.getElementById('button-start-alarm');
  alarmDropDwn = document.getElementById('alarm-selection');
  resetAlarmButton = document.getElementById('button-reset-alarm')

  startAlarmButton.addEventListener('click', e => {
    var alarm = alarmDropDwn.value
    if (alarm == "no-alarm") {
      updateTimeData({ alarm: null})
    }
    else {
      myAlarm = parseInt(alarm)
      myTimer = myAlarm
      startTimer(myAlarm);
      startAlarmButton.setAttribute("disabled", "")
    }
  })

  resetAlarmButton.addEventListener('click', e => {
    startAlarmButton.removeAttribute('disabled')
    document.getElementById('timer-content').innerHTML = ""
    updateTimeData({ alarm: null })
    updateTimeData({ timeLeft: null })
    myTimer = null
    myAlarm = null
  })
}

function timeListener(doc) {
  const alarmDoc = doc.data();
  if (alarmDoc['alarm']) {
    myAlarm = alarmDoc['alarm']
  }
  if (alarmDoc['timeLeft']) {
    myTimer = alarmDoc['timeLeft']
    if (alarmDoc['timeLeft'] == 0) {
      updateTimeData({ timeLeft: null})
      updateTimeData({ alarm: null })
      startAlarmButton.removeAttribute('disabled')
    }
  }
}

function startTimer(alarm) {
  updateTimeData({ alarm: myAlarm, timeLeft: myTimer })
  document.getElementById('timer-content').innerHTML = '00:' + myTimer;

  var timer = setInterval(function () {
    if (myTimer > 0 && alarm > 0) {
      myTimer = alarm
      alarm--;
      updateTimeData({ timeLeft: alarm })
      document.getElementById('timer-content').innerHTML = '00:' + alarm;
    }
    if (myAlarm == null || alarm == 0) {
      clearInterval(timer)
      updateTimeData({ timeLeft: null })
      updateTimeData({ timeLeft: null })
      myTimer = null
      myAlarm = null
      document.getElementById('timer-content').innerHTML = ""
      startAlarmButton.removeAttribute('disabled')

    }
  }, 1000);
}