'use strict';
// VARS
var transitionType = 'fast';
var currentExerciseType = '';
var audioUrl = '';
var wId;
var mrId;
var wavesurfer;
var playing = false;
var loop = false;
var rate = 1;
var helpAudioPlayer;
var currentRegion = null;
var helpRegion;
var regions = [];
var helpButton;
var domUtils;
var helpIsPlaying = false;
var utterance; // webspeech utterance
var strUtils;
var isInAutoPause = false;
var showTextTranscription;
var currentHelpTextIndex = 0;
var currentAutoPauseRegion;
var bbbTimeout; // timeout for backward building
var autoPauseTimeOut;

var wavesurferOptions = {
    container: '#waveform',
    waveColor: '#172B32',
    progressColor: '#00A1E5',
    height: 256,
    interact: true,
    scrollParent: false,
    normalize: true,
    minimap: true
};



// ======================================================================================================== //
// ACTIONS BOUND WHEN DOM READY END
// ======================================================================================================== //

$(document).ready(function() {
    // get some hidden inputs usefull values
    currentExerciseType = 'audio';
    showTextTranscription = $('input[name="textTranscription"]').val() === '1' ? true : false;
    // js helpers
    domUtils = Object.create(DomUtils);
    strUtils = Object.create(StringUtils);
    wId = $('input[name="wId"]').val();
    mrId = $('input[name="mrId"]').val();

    /* WAVESURFER */
    wavesurfer = Object.create(WaveSurfer);

    // wavesurfer progress bar
    (function() {
        var progressDiv = document.querySelector('#progress-bar');
        var progressBar = progressDiv.querySelector('.progress-bar');
        var showProgress = function(percent) {
            progressDiv.style.display = 'block';
            progressBar.style.width = percent + '%';
        };
        var hideProgress = function() {
            progressDiv.style.display = 'none';
        };
        wavesurfer.on('loading', showProgress);
        wavesurfer.on('ready', hideProgress);
        wavesurfer.on('destroy', hideProgress);
        wavesurfer.on('error', hideProgress);
    }());

    wavesurfer.init(wavesurferOptions);

    audioUrl = Routing.generate('innova_get_mediaresource_resource_file', {
        workspaceId: wId,
        id: mrId
    });
    helpAudioPlayer = document.getElementById('html-audio');
    helpAudioPlayer.src = audioUrl;
    wavesurfer.load(audioUrl);

    // used for the "auto-pause" playback
    /*helpAudioPlayer.addEventListener('timeupdate', function() {
        if (isInAutoPause && helpAudioPlayer.currentTime >= currentAutoPauseRegion.end) {
            helpAudioPlayer.pause();
            wavesurfer.pause();
            var nextRegion = getRegionFromTime(currentAutoPauseRegion.end + 0.1);
            if (nextRegion) {
                window.setTimeout(function() {
                    currentAutoPauseRegion = nextRegion;
                    var progress = currentAutoPauseRegion.start / wavesurfer.getDuration();
                    wavesurfer.seekTo(progress);
                    console.log('currentAutoPauseRegion.start');
                    console.log(currentAutoPauseRegion.start);
                    playAutoPause(currentAutoPauseRegion.start);
                }, 2000);
            } else {
                wavesurfer.seekTo(0);
                helpAudioPlayer.pause();
                wavesurfer.setVolume(1);
                isInAutoPause = false;
            }
        }
    });*/

    createRegions();
    if (regions.length > 0) {
        currentRegion = regions[0];
        if (showTextTranscription) {
            // show help text
            $('.help-text').html(currentRegion.note);
        }
    }

    wavesurfer.on('ready', function() {
        var timeline = Object.create(WaveSurfer.Timeline);
        timeline.init({
            wavesurfer: wavesurfer,
            container: '#wave-timeline'
        });
    });

    wavesurfer.on('seek', function() {
        if (playing) {
            wavesurfer.pause();
            // pause help
            helpAudioPlayer.pause();
            helpAudioPlayer.currentTime = 0;
            wavesurfer.setVolume(1);
            wavesurfer.setPlaybackRate(1);
        }
        var current = getRegionFromCurrentTime();
        if (current && currentRegion && current.id != currentRegion.id) {
            // update current region
            currentRegion = current;
            if (showTextTranscription) {
                // show help text
                $('.help-text').html(currentRegion.note);
            }
        }

        if (!playing) {
            helpRegion = current;
            // hide any previous help info
            $('.region-highlight').remove();
            hideHelp();
            // show current help infos
            currentHelpTextIndex = 0;
            showHelp();
            highlight();
        } else {
            if (helpRegion && current && current.id != helpRegion.id) {
                $('.region-highlight').remove();
                hideHelp();
                currentHelpTextIndex = 0;
            }
            wavesurfer.play();
        }
    });

    wavesurfer.on('audioprocess', function() {
        // check regions and display text
        var current = getRegionFromCurrentTime();
        if (current && currentRegion && current.id != currentRegion.id) {
            // update current region
            currentRegion = current;
            if (showTextTranscription) {
                // show help text
                $('.help-text').html(currentRegion.note);
            }

        }
    });

    wavesurfer.on('finish', function() {
        wavesurfer.seekAndCenter(0);
        wavesurfer.pause();
        playing = false;
    });
    /* /WAVESURFER */
});

function toggleTextTranscription() {
    showTextTranscription = !showTextTranscription;
    if (showTextTranscription) {
        $('.help-text').html(currentRegion.note);
    } else {
        $('.help-text').html('');
    }
}

function highlight() {
    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();
    var cHeight = $canvas.height();
    var current = getRegionFromCurrentTime();
    var left = getPositionFromTime(parseFloat(current.start));
    var width = getPositionFromTime(parseFloat(current.end)) - left;

    var elem = document.createElement('div');
    elem.className = 'region-highlight';
    elem.style.left = left + 'px';
    elem.style.width = width + 'px';
    elem.style.height = cHeight + 'px';
    elem.style.top = '0px';
    $('#waveform').find('wave').first().append(elem);
    helpRegion = current;
}

function getPositionFromTime(time) {
    var duration = wavesurfer.getDuration();
    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();

    return time * cWidth / duration;
}

// play
function play() {
    isInAutoPause = false;
    helpAudioPlayer.pause();
    helpAudioPlayer.currentTime = 0;
    wavesurfer.playPause();
    playing = playing ? false : true;
    if (playing) {
        $('#btn-play').removeClass('fa-play').addClass('fa-pause');
        $('.region-highlight').remove();
        hideHelp();
    } else {
        // show available help if any
        $('#btn-play').removeClass('fa-pause').addClass('fa-play');
        highlight();
        showHelp();
    }
}

// play with auto pause
function autoPause() {
    if (playing) {
        helpAudioPlayer.pause();
        if (wavesurfer.isPlaying()) wavesurfer.pause();
        $('#btn-auto-pause').removeClass('fa-pause').addClass('fa-step-forward');
        window.clearTimeout(autoPauseTimeOut);
        isInAutoPause = false;
        playing = false;
        $('#waveform').prop('disabled', false);
    } else {
        $('#waveform').prop('disabled', true);
        $('#btn-auto-pause').removeClass('fa-step-forward').addClass('fa-pause');
        $('#btn-auto-pause');
        isInAutoPause = true;
        playing = true;
        var region = getRegionFromTime(wavesurfer.getCurrentTime());
        playAutoPause(region);
    }
}

function getRegionFromTime(time) {
    var region;
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].start <= time && regions[i].end > time) {
            region = regions[i];
            break;
        }
    }
    return region;
}

function playAutoPause(region) {
  isInAutoPause = true;
  var options = {
      start: region.start,
      end: region.end,
      color: 'rgba(0,0,0,0)',
      drag: false,
      resize: false
  };
  var wRegion = wavesurfer.addRegion(options);
  wRegion.play();
  wavesurfer.once('pause', function(){
      wavesurfer.clearRegions();
      var nextRegion = getNextRegion(region.end);
      if (nextRegion) {
          autoPauseTimeOut = window.setTimeout(function() {
              playAutoPause(nextRegion);
          }, 2000);
      } else {
          isInAutoPause = false;
      }
  });
}

function getNextRegion(time) {
    var next;
    // find next region relatively to given time
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].start == time) {
            next = regions[i];
        }
    }
    return next;
}

function playInLoop() {
    hideHelpText();
    wavesurfer.setPlaybackRate(1);
    var options = {
        start: helpRegion.start,
        end: helpRegion.end,
        loop: true,
        drag: false,
        resize: false,
        color: 'rgba(0,0,0,0)' //invisible
    };
    var region = wavesurfer.addRegion(options);
    if (playing) {
        playing = false;
        wavesurfer.pause();
        wavesurfer.clearRegions();
    } else {
        region.play();
        playing = true;
    }
}

function playSlowly() {
    hideHelpText();
    //var current = getRegionFromCurrentTime();
    var options = {
        start: helpRegion.start,
        end: helpRegion.end,
        loop: false,
        drag: false,
        resize: false,
        color: 'rgba(0,0,0,0)' //invisible
    }
    var region = wavesurfer.addRegion(options);
    // stop playing if playing
    if (playing) {
        playing = false;
        wavesurfer.pause();
        wavesurfer.clearRegions();
        wavesurfer.setPlaybackRate(1);
        helpAudioPlayer.pause();
        wavesurfer.setVolume(1);
    } else {
        wavesurfer.setPlaybackRate(0.8);
        wavesurfer.setVolume(0);
        helpAudioPlayer.playbackRate = 0.8;
        helpAudioPlayer.currentTime = helpRegion.start;
        region.play();
        helpAudioPlayer.play();
        playing = true;
        // at the end of the region stop every audio readers
        wavesurfer.once('pause', function() {
            playing = false;
            //wavesurfer.pause();
            helpAudioPlayer.pause();
            var progress = region.start / wavesurfer.getDuration();
            wavesurfer.seekTo(progress);
            helpAudioPlayer.currentTime = region.start;
            wavesurfer.clearRegions();
            wavesurfer.setPlaybackRate(1);
            wavesurfer.setVolume(1);
            helpAudioPlayer.playbackRate = 1;
        });
    }
}

function playBackward() {
    hideHelpText();
    // is playing for real audio (ie not for TTS)
    if (playing) {
        // stop audio playback before playing TTS
        helpAudioPlayer.pause();
        playing = false;
    }
    if (window.SpeechSynthesisUtterance === undefined) {
        console.log('not supported!');
    } else {
        var text = strUtils.removeHtml(currentRegion.note);
        var array = text.split(' ');
        var start = array.length - 1;
        // check if utterance is already speaking before playing (multiple click on backward button)
        if (!window.speechSynthesis.speaking) {
            handleUtterancePlayback(start, array);
        }
    }
}

function sayIt(text, callback) {
    var utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    var lang = $('input[name=tts]').val();
    var voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        // chrome hack...
        bbbTimeout = window.setTimeout(function() {
            voices = window.speechSynthesis.getVoices();
            continueToSay(utterance, voices, lang, callback);
        }, 200);
    } else {
        continueToSay(utterance, voices, lang, callback);
    }
}

function continueToSay(utterance, voices, lang, callback) {
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang == lang) {
            utterance.voice = voices[i];
        }
    }
    window.speechSynthesis.speak(utterance);
    utterance.onend = function(event) {
        return callback();
    };
}

function handleUtterancePlayback(index, textArray) {
    var toSay = '';
    var length = textArray.length;
    for (var j = index; j < length; j++) {
        toSay += textArray[j] + ' ';
    }
    if (index >= 0) {
        playing = true;
        sayIt(toSay, function() {
            index = index - 1;
            handleUtterancePlayback(index, textArray);
        });
    } else {
        playing = false;
    }
}


function showHelp() {
    var current = getRegionFromCurrentTime();
    var $root = $('.help-container');
    var html = '';
    if (current.hasHelp) {
        if (current.loop) {
            $('#btn-loop').prop('disabled', false);
        } else {
            $('#btn-loop').prop('disabled', true);
        }
        if (current.backward) {
            $('#btn-backward').prop('disabled', false);
        } else {
            $('#btn-backward').prop('disabled', true);
        }
        if (current.rate) {
            $('#btn-slow').prop('disabled', false);
        } else {
            $('#btn-slow').prop('disabled', true);
        }
        if (current.texts.length > 0) {
            $('#btn-text').prop('disabled', false);
            $('.my-label').show();
        } else {
            $('#btn-text').prop('disabled', true);
            $('.my-label').hide();
        }
        $root.show();
    }
}

function hideHelp(){
  $('.help-container').hide();
  currentHelpTextIndex = 0;
  // hide the help text container
  hideHelpText();
}

function showHelpText() {
    if (playing) {
        playing = false;
        if (wavesurfer.isPlaying()) wavesurfer.pause();
        helpAudioPlayer.pause();
        if (window.speechSynthesis.speaking) {
            // can not really stop playing tts since the callback can not be canceled
            window.speechSynthesis.cancel();
        }
    }
    var current = getRegionFromCurrentTime();

    $('.help-text-item').text(current.texts[currentHelpTextIndex]);
    if (currentHelpTextIndex < current.texts.length - 1) {
        currentHelpTextIndex++;
    } else {
        currentHelpTextIndex = 0;
    }
    // say to user there is another text available (so if we currently display the text number 1 the label should display 2)
    var displayIndex = currentHelpTextIndex + 1;
    $('.my-label').text(displayIndex);
    $('.help-text-container').show();
}

function hideHelpText() {
    currentHelpTextIndex = 0;
    $('.my-label').text('1');
    $('.help-text-container').hide();
}

function getRegionFromCurrentTime() {
    var currentTime = wavesurfer.getCurrentTime();
    var region;
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].start <= currentTime && regions[i].end > currentTime) {
            region = regions[i];
            break;
        }
    }
    return region;
}

function createRegions() {
    $(".region").each(function() {
        var start = $(this).find('input.hidden-start').val();
        var end = $(this).find('input.hidden-end').val();
        var note = $(this).find('input.hidden-note').val();
        var id = $(this).find('input.hidden-region-id').val();
        var uuid = $(this).find('input.hidden-region-uuid').val();
        var helpUuid = $(this).find('input.hidden-config-help-region-uuid').val();
        var loop = $(this).find('input.hidden-config-loop').val() === '1';
        var backward = $(this).find('input.hidden-config-backward').val() === '1';
        var rate = $(this).find('input.hidden-config-rate').val() === '1';
        var texts = $(this).find('input.hidden-config-text').val() !== '' ? $(this).find('input.hidden-config-text').val().split(';') : false;
        var hasHelp = rate || backward || (texts && texts.length > 0) || loop || helpUuid !== '';
        var region = {
            id: id,
            uuid: uuid,
            start: start,
            end: end,
            note: note,
            hasHelp: hasHelp,
            helpUuid: helpUuid,
            loop: loop,
            backward: backward,
            rate: rate,
            texts: texts
        };
        regions.push(region);
    });
    if (regions.length === 0) {
        var region = {
            id: 0,
            uuid: '',
            start: 0,
            end: wavesurfer.getDuration(),
            note: '',
            hasHelp: false,
            helpUuid: '',
            loop: false,
            backward: false,
            rate: false,
            texts: false
        };
        regions.push(region);
    }
    return true;
}
