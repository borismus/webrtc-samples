var video = document.querySelector('video');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var width;
var height;

// 2D array of buckets[position][frequency]
var buckets = emptyArray(12);

navigator.webkitGetUserMedia('video', onStream, onError);

function onStream(stream) {
  video.src = window.webkitURL.createObjectURL(stream)
}

function onError(err) {
  console.log('Unable to get video stream!')
}

video.addEventListener('play', function() {
  width = video.clientWidth;
  height = video.clientHeight;
  canvas.width = width;
  canvas.height = height;
  // Start getting stills from the video stream.
  webkitRequestAnimationFrame(scan);
}, false);

/**
 * Returns the barcode if confident. Otherwise, returns false.
 */
function computeBarcode() {
  var code = '';
  for (var pos = 0; pos < buckets.length; pos++) {
    var bucket = buckets[pos];
    var total = sum(bucket);
    var isConfident = false;
    var num = null;

    for (var value = 0; value < 10; value++) {
      var prob = bucket[value] / total;
      if (prob > 0.4) {
        isConfident = true;
        num = value;
      }
    }

    if (isConfident) {
      code += num;
    } else {
      console.log('failed on position',  pos);
      return false;
    }
  }
  return code;
}

function gatherData(barcode) {
  for (var pos = 0; pos < barcode.length; pos++) {
    if (buckets[pos] == 0) {
      // Populate with an empty array of values.
      buckets[pos] = emptyArray(10);
    }
    var value = barcode[pos];
    if (value != 'X') {
      console.log('value', pos, value);
      value = parseInt(value);
      buckets[pos][value] += 1;
    }
  }
}

function sum(arr) {
  var total = 0;
  for (var i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

function emptyArray(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr.push(0);
  }
  return arr;
}

function scan() {
  ctx.drawImage(video, 0, 0, width, height);
  // Render a barcode scanning animation in a canvas element.
  // Run the barcode recognizer software on each still.
  var barcode = getBarcodeFromImage(canvas);
  // For each result from the scan, populate the buckets.
  gatherData(barcode);
  // Check if we've found the barcode:
  var verifiedBarcode = computeBarcode();
  // If there's a match:
  if (verifiedBarcode) {
    // Play a sound, make an XHR to get more information about the product.
    alert('BARCODE FOUND: ' + verifiedBarcode);
  } else {
    // Otherwise, go again!
    webkitRequestAnimationFrame(scan);
  }
}
