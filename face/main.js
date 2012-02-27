// Really simple face recognition thing. Shows camera stream, and lets you
// click on a button to recognize the face. Draws geometry with canvas, and
// writes all of the relevant information that the API endpoint gives:
//
// http://developers.face.com/docs/api/faces-detect/
//
// Uses REST because I can't figure out the JS library.


// Face API configuration.
var FACE_KEY = '8931f9c0de1ee2cc57497c46722715b5';
var FACE_SECRET = '2754847805f8a81a9dade2e56d54d1b8';
var FACE_URL = 'http://api.face.com/faces/detect.json';
// ?api_key={{API_SECRET}}&api_secret=&urls={{URLS}}&detector=Aggressive&attributes=all'

// Imgur API configuration.
var IMGUR_KEY = '11e00c46b37ef34d1af937155505e59c';
var IMGUR_URL = 'http://api.imgur.com/2/upload.json';


// Elements on the page.
var video = document.querySelector('video');

// Setup the video stream.
navigator.webkitGetUserMedia('video', onStream, onError);

function onStream(stream) {
  video.src = window.webkitURL.createObjectURL(stream)
}

function onError(err) {
  console.log('Unable to get video stream!')
}

// Hook up button.
document.querySelector('button').addEventListener('click', function(e) {
  // Capture the contents of the video element as base64 encoded image.
  var base64 = videoToBase64(video);
  // Upload the still to an imgur via toDataURL.
  var url = uploadToImgur(base64);
  // Make a call to the Face API.
  var faceData = analyzeImageFaces(url);
  // Show the results payload in the page.
  console.log(faceData);
  // Write some data out to the page.
  showData(faceData);
});

function videoToBase64(video) {
  var width = video.clientWidth;
  var height = video.clientHeight;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  // Create new canvas.
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL().split(',')[1];;
}

function uploadToImgur(base64EncodedImage) {
  var options = {
    image: base64EncodedImage,
    type: 'base64',
    key: IMGUR_KEY
  };
  $.ajax(IMGUR_URL, {
    type: 'POST',
    async: false,
    data: options,
    success: onSuccess
  });
  function onSuccess(response) {
    url = response.upload.links.original;
  }
  return url;
}

function analyzeImageFaces(url) {
  var data;
  var options = {
    api_key: FACE_KEY,
    api_secret: FACE_SECRET,
    detector: 'Aggressive',
    attributes: 'all',
    urls: url
  }
  $.ajax(FACE_URL, {
    type: 'POST',
    async: false,
    data: options,
    success: onSuccess
  });
  function onSuccess(response) {
    data = response;
  }
  return data;
}

function showData(faceData) {
  // Create a canvas overlaid over the image.
  var photo = faceData.photos[0];
  var img = new Image();
  img.src = photo.url;
  img.onload = showDataHelper;
  var canvas;
  var parent = $('<div class="photo"></div>');

  function showDataHelper() {
    canvas = createCanvas(img);
    parent.append(canvas);
    var tags = photo.tags;
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      renderFeatures(tag);
      showTag(tag);
    }
  }


  function showTag(tag) {
    var attrs = tag.attributes;
    var data = {};
    for (var attr in attrs) {
      var detail = attrs[attr];
      if (detail.confidence > 50) {
        data[attr] = detail.value;
      }
    }
    var template = document.querySelector('#face-attributes').innerHTML;
    var info = Mustache.to_html(template, data);
    parent.prepend(info);

    $(document.body).append(parent);
  }

  function renderFeatures(tag) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    // Draw outline for face.
    ctx.strokeStyle = 'black';
    ctx.strokeRect((tag.center.x - tag.width/2) * w/100, (tag.center.y - tag.height/2) * h/100,
                   tag.width * w/100, tag.height * h/100);
    // Draw a shape for the mouth.
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.strokeWidth = 5;
    ctx.moveTo(tag.mouth_left.x * w/100, tag.mouth_left.y * h/100);
    ctx.lineTo(tag.mouth_center.x * w/100, tag.mouth_center.y * h/100);
    ctx.lineTo(tag.mouth_right.x * w/100, tag.mouth_right.y * h/100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeWidth = 1;
    ctx.font = "20px Arial";
    var text = document.querySelector('input').value;

    var size = ctx.measureText(text);
    var text_x = (tag.mouth_right.x + 5) * w/100;
    var text_y = tag.mouth_right.y * h/100
    var text_height = 20;
    var d = 5;
    ctx.fillRect(text_x - d, text_y - text_height - d, size.width + 2*d, text_height + 2*d);
    ctx.strokeText(text, text_x, text_y);
  }
}

function createCanvas(image) {
  var width = video.clientWidth;
  var height = video.clientHeight;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  return canvas;
}
