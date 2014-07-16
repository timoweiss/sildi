(function(window) {
    // Socket connection
    var socket = io('http://localhost:3700');

    // readyForStream will be emmited when the connection has been established
    socket.on('readyForStream', function() {
        console.log('readyForStream');

        // check for browser-specific implementations
        if (!navigator.getUserMedia) {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia;
        }

        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                audio: true
            }, success, function(e) {
                alert('Error capturing audio.');
            });
        } else {
            alert('getUserMedia not supported in this browser.');
        }

        var recording = true;

        function success(e) {
            audioContext = window.AudioContext || window.webkitAudioContext;
            context = new audioContext();

            // the sample rate is in context.sampleRate
            audioInput = context.createMediaStreamSource(e);

            var bufferSize = 2048;
            recorder = context.createJavaScriptNode(bufferSize, 1, 1);

            // define callback
            recorder.onaudioprocess = function(e) {
                if (!recording) return;
                var left = e.inputBuffer.getChannelData(0);

                // emit the data converted to the server
                socket.emit('streaming', {
                    stream: convertoFloat32ToInt16(left)
                });
            };

            audioInput.connect(recorder);
            recorder.connect(context.destination);
        }


        socket.on('back', function(data) {
            //play(data.chunk);
            // play(data);
            console.log(new DataView(data.chunk));
            processConcatenatedFile(data.chunk);
            // context.decodeAudioData(data.chunk, function (a) {
            //     console.log(a);
            //     play(a);
            // }, function (e) {
            //     //console.error(arguments);
            // });
        });

    });

    function convertoFloat32ToInt16(buffer) {
        var l = buffer.length;
        var buf = new Int16Array(l);

        while (l--) {
            buf[l] = buffer[l] * 0xFFFF; //convert to 16 bit
        }
        return buf.buffer;
    }

})(this);
