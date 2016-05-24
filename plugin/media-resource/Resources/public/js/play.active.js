// INNOVA JAVASCRIPT HELPERS /OBJECTS
var strUtils;
var wavesurferUtils;
var javascriptUtils;
var domUtils;

// VARS
var transitionType = 'fast';
var currentExerciseType = '';
var audioUrl;
var wId;
var mrId;
var wavesurfer;
var playing = false;

// current help options
var helpPlaybackBackward = false;
var helpIsPlaying = false;
var helpPlaybackLoop = false;
var helpPlaybackRate = 1;
var helpAudioPlayer;
var helpCurrentWRegion; // the wavesurfer region where we are when asking help
var helpPreviousWRegion; // the previous wavesurfer region relatively to helpCurrentWRegion
var currentHelpRelatedRegion; // the related help region;
var helpRegion; // the region we are listening to
var currentHelpTextLevel = 0;
var hModal;
var helpAudioPlayer;

var wavesurferOptions = {
    container: '#waveform',
    waveColor: '#172B32',
    progressColor: '#00A1E5',
    height: 256,
    scrollParent: true,
    normalize: true,
    minimap: true
};



// ======================================================================================================== //
// ACTIONS BOUND WHEN DOM READY (PLAY / PAUSE, MOVE BACKWARD / FORWARD, ADD MARKER, CALL HELP, ANNOTATE)
// ======================================================================================================== //
var actions = {
    play: function() {
        if (!playing) {
            wavesurfer.play();
            playing = true;
        } else {
            wavesurfer.pause();
            playing = false;
        }
    },
    backward: function() {
        if (Object.keys(wavesurfer.regions.list).length > 1) {
            var current = wavesurferUtils.getCurrentRegion(wavesurfer, wavesurfer.getCurrentTime() - 0.1);
            goTo(current ? current.start : 0);
        } else {
            wavesurfer.seekAndCenter(0);
        }
        var region = wavesurferUtils.getCurrentRegion(wavesurfer, wavesurfer.getCurrentTime() - 0.1);
        if (region) {
            domUtils.highlightRegionRow(region); //highlightRegionRow(region);
        }
    },
    forward: function() {
        if (Object.keys(wavesurfer.regions.list).length > 1) {
            var current = wavesurferUtils.getCurrentRegion(wavesurfer, wavesurfer.getCurrentTime() + 0.1);
            goTo(current ? current.end : 1);
        } else {
            wavesurfer.seekAndCenter(1);
        }
        var region = wavesurferUtils.getCurrentRegion(wavesurfer, wavesurfer.getCurrentTime() + 0.1);
        if (region) {
            domUtils.highlightRegionRow(region); //highlightRegionRow(region);
        }
    },
    help: function() {
        // get current wavesurfer region
        helpCurrentWRegion = wavesurferUtils.getCurrentRegion(wavesurfer, wavesurfer.getCurrentTime() + 0.1);
        // get previous
        helpPreviousWRegion = wavesurferUtils.getPrevRegion(wavesurfer, wavesurfer.getCurrentTime() + 0.1);

        // open modal
        hModal = domUtils.openRegionHelpModal(helpCurrentWRegion, helpPreviousWRegion, audioUrl);

        hModal.on('shown.bs.modal', function() {

            // by default the current region is selected so we append to modal help tab the current region help options
            var currentDomRow = domUtils.getRegionRow(helpCurrentWRegion.start + 0.1, helpCurrentWRegion.end - 0.1);
            var config = domUtils.getRegionRowHelpConfig(currentDomRow);
            domUtils.appendHelpModalConfig(hModal, config, helpCurrentWRegion);

            helpRegion = {
                start: helpCurrentWRegion.start + 0.1,
                end: helpCurrentWRegion.end - 0.1
            };

            helpAudioPlayer = document.getElementsByTagName("audio")[0];

            helpAudioPlayer.addEventListener('timeupdate', function() {
                if (helpAudioPlayer.currentTime >= helpRegion.end) {
                    helpAudioPlayer.pause();
                    helpAudioPlayer.currentTime = helpRegion.start;
                    if (helpAudioPlayer.loop) {
                        helpAudioPlayer.play();
                    } else {
                        helpIsPlaying = false;
                    }
                }
            });

            // listen to tab click event
            $('#help-tab-panel a').click(function(e) {
                e.preventDefault();

                if (helpIsPlaying) {
                    helpAudioPlayer.pause();
                    helpIsPlaying = false;
                }

                $(this).tab('show');
            });
        });

        hModal.on('hidden.bs.modal', function() {
            helpPlaybackLoop = false;
            helpPlaybackRate = 1;
            helpPlaybackBackward = false;
            helpIsPlaying = false;
            helpPreviousWRegion = null;
            helpCurrentWRegion = null;
            hModal = null;
            helpRegion = {};
        });

        hModal.modal("show");
    }
};

// ======================================================================================================== //
// ACTIONS BOUND WHEN DOM READY END
// ======================================================================================================== //

// ======================================================================================================== //
// DOCUMENT READY
// ======================================================================================================== //
$(document).ready(function() {

    // get some hidden inputs usefull values
    currentExerciseType = 'audio';

    wId = $('input[name="wId"]').val();
    mrId = $('input[name="mrId"]').val();

    // color config region buttons if needed
    toggleConfigButtonColor();

    // bind data-action events
    $("button[data-action]").click(function() {
        var action = $(this).data('action');
        if (actions.hasOwnProperty(action)) {
            actions[action]($(this));
        }
    });


    /* JS HELPERS */
    strUtils = Object.create(StringUtils);
    wavesurferUtils = Object.create(WavesurferUtils);
    javascriptUtils = Object.create(JavascriptUtils);
    domUtils = Object.create(DomUtils);
    /* /JS HELPERS */

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

    /* Minimap plugin */
    wavesurfer.initMinimap({
        height: 30,
        waveColor: '#ddd',
        progressColor: '#999',
        cursorColor: '#999'
    });


    var data = {
        workspaceId: wId,
        id: mrId
    };

    loadAudio(data);

    wavesurfer.on('ready', function() {
        var timeline = Object.create(WaveSurfer.Timeline);
        timeline.init({
            wavesurfer: wavesurfer,
            container: '#wave-timeline'
        });

        // check if there are regions defined
        if ($(".row.form-row.region").size() === 0) {
            // if no region : add one by default
            var region = addRegion(0.0, wavesurfer.getDuration(), '', false);
            var guid = strUtils.createGuid();
            domUtils.addRegionToDom(wavesurfer, wavesurferUtils, region, guid);
        } else {
            // for each existing PHP Region entity ( = region row) create a wavesurfer region
            $(".row.form-row.region").each(function() {
                var start = $(this).find('input.hidden-start').val();
                var end = $(this).find('input.hidden-end').val();
                var note = $(this).find('input.hidden-note').val() ? $(this).find('input.hidden-note').val() : '';
                if (start && end) {
                    addRegion(start, end, note, true);
                }
            });
        }
    });

    wavesurfer.on('region-click', function(region, e) {
        domUtils.highlightRegionRow(region);
    });

    wavesurfer.on('region-in', function(region) {
        domUtils.highlightRegionRow(region);
    });
    /* /WAVESURFER */
});
// ======================================================================================================== //
// DOCUMENT READY END
// ======================================================================================================== //


function loadAudio(data) {
    audioUrl = Routing.generate('innova_get_mediaresource_resource_file', {
        workspaceId: data.workspaceId,
        id: data.id
    });
    wavesurfer.load(audioUrl);
    return true;
}

// ======================================================================================================== //
// HELP MODAL FUNCTIONS
// ======================================================================================================== //
/**
 * play the region (<audio> element) and loop if needed
 * Uses an <audio> element because we might need playback rate modification without changing the pitch of the sound
 * Wavesurfer can't do that for now
 * @param {float} start
 * @param {float} end
 */
function playHelp(start, end, loop, rate) {
    helpAudioPlayer.loop = loop;
    if (rate) {
        helpAudioPlayer.playbackRate = 0.8;
    } else {
        helpAudioPlayer.playbackRate = 1;
    }

    if (helpIsPlaying) {
        helpAudioPlayer.pause();
        helpIsPlaying = false;
    } else {
        helpAudioPlayer.currentTime = start;
        helpAudioPlayer.play();
        helpIsPlaying = true;
    }
}
/**
 * Allow the user to play the help related region
 * @param {float} start
 */
function playHelpRelatedRegion(start) {
    playRegionFrom(start + 0.1);
}

/**
 * Will only work with chrome browser !!
 * Called by HelpModal play backward button
 */
function playBackward() {
    // is playing for real audio (ie not for TTS)
    if (helpIsPlaying && helpAudioPlayer) {
        // stop audio playback before playing TTS
        helpAudioPlayer.pause();
        helpIsPlaying = false;
    }
    if (window.SpeechSynthesisUtterance === undefined) {
        console.log('not supported!');
    } else {

        var row = domUtils.getRegionRow(helpCurrentWRegion.start + 0.1, helpCurrentWRegion.end - 0.1);
        var text = strUtils.removeHtml($(row).find('input.hidden-note').val());
        var array = text.split(' ');
        var start = array.length - 1;
        // check if utterance is already speaking before playing (pultiple click on backward button)
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
    if(voices.length === 0){
      // chrome hack...
      window.setTimeout(function(){
        voices = window.speechSynthesis.getVoices();
        continueToSay(utterance, voices, lang, callback);
      },200);
    } else {
      continueToSay(utterance, voices, lang, callback);
    }
}

function continueToSay(utterance, voices, lang, callback){
  for(var i = 0; i < voices.length ; i++) {
    if(voices[i].lang == lang){
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
        sayIt(toSay, function() {
            index = index - 1;
            handleUtterancePlayback(index, textArray);
        });
    }
}

// ======================================================================================================== //
// HELP MODAL FUNCTIONS END
// ======================================================================================================== //


/**
 * Called by ConfigModal <select> element
 * @param {type} elem the source of the event
 */
function onSelectedRegionChange(elem) {
    var idx = elem.selectedIndex;
    var val = elem.options[idx].value;
    var wRegionId = $('#' + val).find('button.btn-danger').data('id');
    currentHelpRelatedRegion = wavesurfer.regions.list[wRegionId];
    if (playing) {
        wavesurfer.pause();
        playing = false;
    }
}

/**
 * Allow the user to listen to the selected help related region while configuring help
 */
function previewHelpRelatedRegion() {
    if (currentHelpRelatedRegion) {
        playRegionFrom(currentHelpRelatedRegion.start + 0.1);
    }
}

// ======================================================================================================== //
// CONFIG REGION MODAL FUNCTIONS END
// ======================================================================================================== //


// ======================================================================================================== //
// OTHER MIXED FUNCTIONS
// ======================================================================================================== //

/**
 * put the wavesurfer play cursor at the given time and pause playback
 * @param time in seconds
 */
function goTo(time) {
    var percent = (time) / wavesurfer.getDuration();
    wavesurfer.seekAndCenter(percent);
    if (playing) {
        wavesurfer.pause();
        playing = false;
    }
}


/**
 * Called from play button on a region row
 * @param {type} elem
 * @returns {undefined}
 */
function playRegion(elem) {
    var start = parseFloat($(elem).closest('.region').find('.hidden-start').val());
    playRegionFrom(start + 0.1);
}

function playRegionFrom(start) {
    var region = wavesurferUtils.getCurrentRegion(wavesurfer, start);
    if (!playing) {
        wavesurfer.play(region.start, region.end);
        playing = true;
        region.once('out', function() {
            // force pause
            wavesurfer.pause();
            playing = false;
        });
    } else {
        wavesurfer.pause();
        playing = false;
    }
}


// ======================================================================================================== //
//  OTHER MIXED FUNCTIONS END
// ======================================================================================================== //
