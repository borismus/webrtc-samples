var audio = document.querySelector('audio');
var info = document.querySelector('section');
var recButton = document.querySelector('button#rec');
var playButton = document.querySelector('button#play');
var streamRecorder;

var States = {
  NONE: 0,
  REC: 1,
  PLAY: 2
}
var state = States.NONE;

recButton.addEventListener('click', function(e) {
  if (state == States.NONE) {
    recButton.innerText = 'Stop Recording';
    state = States.REC;
    // Start recording the audio stream.
    navigator.webkitGetUserMedia('audio', onStream, onError);
  } else if (state == States.REC) {
    recButton.innerText = 'Record';
    state = States.NONE;
    playButton.style.display = 'inline';
    // Stop recording the audio stream.
    streamRecorder.getRecordedData(gotData);
  }
});

function onStream(stream) {
  // Start listening to the stream, and save it into a blob.
  streamRecorder = stream.record();
}

function onError(err) {
  console.log('Unable to get audio stream!')
}

function gotData(blob) {
  console.log(blob);
}
