// JAVASCRIPT HELPERS /OBJECTS
var strUtils;
var javascriptUtils;
var domUtils;

// VARS
var transitionType = 'fast';
var audioData;
var wId; // Workspace ID
var mrId; // MediaResource ID
var wavesurfer;
var playing = false;
var isInRegionNoteRow = false; // for keyboard event listener, if we are editing a region note row, we don't want the enter keyboard to add a region marker

// current help options
var helpPlaybackBackward = false;
var helpIsPlaying = false;
var helpPlaybackLoop = false;
var helpPlaybackRate = 1;
var helpCurrentRegion; // the region where we are when asking help
var helpPreviousRegion; // the previous region relatively to helpCurrentRegion
var currentHelpRelatedRegion; // the related help region;
var helpRegion; // the region we are listening to
var currentHelpTextLevel = 0;
var hModal;
var htmlAudioPlayer;

// markers
var markers = [];
var regions = [];
var currentRegion = null;

var wavesurferOptions = {
    container: '#waveform',
    waveColor: '#172B32',
    progressColor: '#888',
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
    help: function() {
        helpCurrentRegion = currentRegion;
        // search for prev region only if we are not in the first one
        if(currentRegion.start > 0){
          for(var i = 0; i < regions.length; i++){
            if(regions[i].end === currentRegion.start){
              helpPreviousRegion = regions[i];
            }
          }
        }

        // open modal
        hModal = domUtils.openRegionHelpModal(helpCurrentRegion, helpPreviousRegion);
        hModal.on('shown.bs.modal', function() {

            // by default the current region is selected so we append to modal help tab the current region help options
            var currentDomRow = domUtils.getRegionRow(currentRegion.start + 0.1, currentRegion.end - 0.1);
            domUtils.appendHelpModal(hModal, helpCurrentRegion);

            helpRegion = {
                start: currentRegion.start + 0.1,
                end: currentRegion.end - 0.1
            };

            // listen to tab click event
            $('#help-tab-panel a').click(function(e) {
                e.preventDefault();
                if (playing) {
                    htmlAudioPlayer.pause();
                    playing = false;
                }
                $(this).tab('show');
            });
        });

        hModal.on('hidden.bs.modal', function() {
            if (playing) {
                htmlAudioPlayer.pause();
                playing = false;
            }
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
    wId = $('input[name="wId"]').val();
    mrId = $('input[name="mrId"]').val();

    // bind data-action events
    $("button[data-action]").click(function() {
        var action = $(this).data('action');
        if (actions.hasOwnProperty(action)) {
            actions[action]($(this));
        }
    });

    // HELP MODAL SELECT REGION (CURRENT / PREVIOUS) EVENT
    $('body').on('change', 'input[name=segment]:radio', function(e) {

        if (playing) {
            htmlAudioPlayer.pause();
            playing = false;
        }

        var selectedValue = e.target.value;
        if (selectedValue === 'previous') {
            domUtils.appendHelpModal(hModal, helpPreviousRegion);
            helpRegion = {
                start: helpPreviousRegion.start + 0.1,
                end: helpPreviousRegion.end - 0.1
            };
        } else if (selectedValue === 'current') {
            domUtils.appendHelpModal(hModal, currentRegion);
            helpRegion = {
                start: currentRegion.start + 0.1,
                end: currentRegion.end - 0.1
            };
        }

        // enable selected region preview button only
        $('#help-region-choice .input-group').each(function() {
            $(this).find('button').prop('disabled', $(this).find('input[name=segment]').val() !== selectedValue);
        });
    });

    /* JS HELPERS */
    strUtils = Object.create(StringUtils);
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

    htmlAudioPlayer = document.getElementById('html-audio-player');
    htmlAudioPlayer.src = audioData;

    wavesurfer.on('ready', function() {
        var timeline = Object.create(WaveSurfer.Timeline);
        timeline.init({
            wavesurfer: wavesurfer,
            container: '#wave-timeline'
        });
        initRegions();
        if (regions.length > 0) {
            currentRegion = regions[0];
        }
    });

    wavesurfer.on('seek', function() {
        var current = getRegionFromTime();
        if (current && currentRegion && current.uuid != currentRegion.uuid) {
            // update current region
            currentRegion = current;
        }
    });

    wavesurfer.on('audioprocess', function() {
        // check regions and display text
        var current = getRegionFromTime();
        if (current && currentRegion && current.uuid != currentRegion.uuid) {
            // update current region
            currentRegion = current;
        }
    });
    /* /WAVESURFER */


});
// ======================================================================================================== //
// DOCUMENT READY END
// ======================================================================================================== //


function getRegionFromTime(time) {
    var currentTime = time ? time : wavesurfer.getCurrentTime();
    var region;
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].start <= currentTime && regions[i].end > currentTime) {
            region = regions[i];
            break;
        }
    }
    return region;
}


// build markers, regions from existing ones
function initRegions() {
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
        var texts = [];
        var links = [];
        $(this).find('.hidden-help-texts').each(function() {
            if ($(this).val() !== '') {
                texts.push($(this).val());
            }
        });
        $(this).find('.hidden-help-links').each(function() {
            if ($(this).val() !== '') {
                links.push($(this).val());
            }
        });
        //  var texts = $(this).find('input.hidden-config-text').val() !== '' ? $(this).find('input.hidden-config-text').val().split(';') : false;
        var hasHelp = rate || backward || texts.length > 0 || links.length > 0 || loop || helpUuid !== '';
        var region = {
            id: id,
            uuid: uuid,
            start: Number(start),
            end: Number(end),
            note: note,
            hasHelp: hasHelp,
            helpUuid: helpUuid,
            loop: loop,
            backward: backward,
            rate: rate,
            texts: texts,
            links: links
        };
        regions.push(region);


    });

    return true;
}

function loadAudio(data) {
    audioData = Routing.generate('innova_get_mediaresource_resource_file', {
        workspaceId: data.workspaceId,
        id: data.id
    });
    wavesurfer.load(audioData);
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
    htmlAudioPlayer.loop = loop;
    if (rate) {
        htmlAudioPlayer.playbackRate = 0.8;
    } else {
        htmlAudioPlayer.playbackRate = 1;
    }

    if (playing) {
        htmlAudioPlayer.pause();
        playing = false;
    } else {
        htmlAudioPlayer.currentTime = start;
        htmlAudioPlayer.play();
        playing = true;

    }

    var self = this;
    self.regionEnd = end;
    self.regionStart = start;
    htmlAudioPlayer.addEventListener('timeupdate', function() {
        if (htmlAudioPlayer.currentTime >= self.regionEnd) {
            htmlAudioPlayer.pause();
            htmlAudioPlayer.currentTime = self.regionStart;
            if (htmlAudioPlayer.loop) {
                htmlAudioPlayer.play();
            } else {
                playing = false;
            }
        }
    });
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
    if (playing && htmlAudioPlayer) {
        // stop audio playback before playing TTS
        htmlAudioPlayer.pause();
        playing = false;
    }
    if (window.SpeechSynthesisUtterance === undefined) {
        console.log('not supported!');
    } else {
        var text = strUtils.removeHtml(currentRegion.note);
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
    if (voices.length === 0) {
        // chrome hack...
        window.setTimeout(function() {
            voices = window.speechSynthesis.getVoices();
            continueToSay(utterance, voices, lang, callback);
        }.bind(this), 200);
    } else {
        continueToSay(utterance, voices, lang, callback);
    }
}

function continueToSay(utterance, voices, lang, callback) {
    for (var i = 0; i < voices.length; i++) {
        // voices names are not the same chrome is always code1-code2 while fx is sometimes code1-code2 and sometimes code1
        var lang2 = lang.split('-')[0];
        if (voices[i].lang == lang || voices[i].lang == lang2) {
            utterance.voice = voices[i];
            break;
        }
    }
    window.speechSynthesis.speak(utterance);
    utterance.onend = function(event) {
        console.log('speech end');
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
 * Region options Modal
 * Allow the user to listen to the selected help related region while configuring help
 * Uses html audio player to avoid wavesurfer animations behind the modal while playing
 **/
$('body').on('click', '#btn-help-related-region-play', function(){
  if(currentHelpRelatedRegion){
      playHelp(currentHelpRelatedRegion.start, currentHelpRelatedRegion.end, false, false);
  }
});

// color config region buttons if
function checkIfRowHasConfigValue(row) {
    var helpRegion = $(row).find('.hidden-config-help-region-uuid').val() !== '' ? true : false;
    var loop = $(row).find('.hidden-config-loop').val() === '1' ? true : false;
    var backward = $(row).find('.hidden-config-backward').val() === '1' ? true : false;
    var rate = $(row).find('.hidden-config-rate').val() === '1' ? true : false;
    var text = $(row).find('.hidden-config-text').val() !== '' ? true : false;
    return helpRegion || loop || backward || rate || text;
}

// ======================================================================================================== //
// CONFIG REGION MODAL FUNCTIONS END
// ======================================================================================================== //





function getMarkerLeftPostionFromTime(time) {
    var duration = wavesurfer.getDuration();
    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();
    return time * cWidth / duration;
}




// ======================================================================================================== //
// MARKERS END
// ======================================================================================================== //


// ======================================================================================================== //
// REGIONS (Objects)
// ======================================================================================================== //

function getRegionById(id){
  var searched;
    for(var i = 0 ; i < regions.length; i++){
      if(regions[i].id === id){
        searched = regions[i];
      }
    }
    return searched;
}


function getRegionByUuid(uuid){
  var searched;
    for(var i = 0 ; i < regions.length; i++){
      if(regions[i].uuid === uuid){
        searched = regions[i];
      }
    }
    return searched;
}



function getNextRegion(time){
  var next;
  var region;
  if(time){
    region = getRegionFromTime(time);
  } else {
    region = currentRegion;
  }
  // find next region relatively to current
  for(var i = 0; i < regions.length; i++){
    if(regions[i].start == region.end){
      next = regions[i];
    }
  }
  return next;
}

function getPrevRegion(time){
  var prev;
  var region;
  if(time){
    region = getRegionFromTime(time);
  } else {
    region = currentRegion;
  }
  if(region){
    // find next region relatively to current
    for(var i = 0; i < regions.length; i++){
      if(regions[i].end == region.start){
        prev = regions[i];
      }
    }
  }
  return prev;
}

/**
 * Called from play button on a region row
 * @param {type} elem
 * @returns {undefined}
 */
function playRegion(elem) {
    var start = Number($(elem).closest('.region').find('.hidden-start').val());
    playRegionFrom(start + 0.1);
}

function playRegionFrom(start) {
    var region = getRegionFromTime(start);
    var wRegion = wavesurfer.addRegion({
      start:region.start,
      end:region.end,
      color: 'rgba(0,0,0,0)',
      drag: false,
      resize:false
    });
    if (!playing) {
        wRegion.play();
        playing = true;
        wavesurfer.once('pause', function() {
            playing = false;
            // remove all wavesurfer regions as we do not use them elsewhere
            wavesurfer.clearRegions();
        });
    } else {
        wavesurfer.pause();
        playing = false;
    }
}

// ======================================================================================================== //
// END REGIONS
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

function getTimeFromPosition(position) {
    var duration = wavesurfer.getDuration();
    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();
    return position * duration / cWidth;
}



// ======================================================================================================== //
//  OTHER MIXED FUNCTIONS END
// ======================================================================================================== //
