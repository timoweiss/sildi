(function (window) {
    var socket = io('http://localhost:3700');

    socket.on('readyForStream', function () {
        console.log('readyForStream');


        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                audio: true
            }, success, function (e) {
                alert('Error capturing audio.');
            });
        }
        else alert('getUserMedia not supported in this browser.');

        var recording = true;

        function success(e) {
            audioContext = window.AudioContext || window.webkitAudioContext;
            context = new audioContext();

            // the sample rate is in context.sampleRate
            audioInput = context.createMediaStreamSource(e);

            var bufferSize = 2048;
            recorder = context.createJavaScriptNode(bufferSize, 1, 1);

            recorder.onaudioprocess = function (e) {
                if (!recording) return;
                var left = e.inputBuffer.getChannelData(0);
                socket.emit('streaming', {
                    stream: convertoFloat32ToInt16(left)
                });
                //play(left);
            };

            audioInput.connect(recorder)
            recorder.connect(context.destination);
        }


        socket.on('back', function (data) {
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


        function processConcatenatedFile(data) {

            var bb = new DataView(data);
            var offset = 0;

            while (offset < bb.byteLength) {

                var length = bb.getUint32(offset, true);
                offset += 4;
                var sound = extractBuffer(data, offset, length);
                offset += length;

                createSoundWithBuffer(sound.buffer);

            }

        }

        function extractBuffer(src, offset, length) {

            var dstU8 = new Uint8Array(length);
            var srcU8 = new Uint8Array(src, offset, length);
            dstU8.set(srcU8);
            return dstU8;

        }

        function createSoundWithBuffer(buffer) {

            /*
        This audio context is unprefixed!
    */
            var context = new AudioContext();

            var audioSource = context.createBufferSource();
            audioSource.connect(context.destination);

            context.decodeAudioData(buffer, function (res) {

                audioSource.buffer = res;

                /*
           Do something with the sound, for instance, play it.
           Watch out: all the sounds will sound at the same time!
        */
                audioSource.noteOn(0);

            });

        }


        function play(incomingData) {
            source = context.createBufferSource(); // Create Sound Source
            //buffer = context.createBuffer(incomingData, true); // Create Mono Source Buffer from Raw Binary
            source.buffer = incomingData; // Add Buffered Data to Object
            source.connect(context.destination); // Connect Sound Source to Output
            //        source.start(0);
            source.noteOn(context.currentTime); // Play the Source when Triggered
        }

    });

    function convertoFloat32ToInt16(buffer) {
        var l = buffer.length;
        var buf = new Int16Array(l);

        while (l--) {
            buf[l] = buffer[l] * 0xFFFF; //convert to 16 bit
        }
        return buf.buffer
    }




})(this);
