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
    backward: function() {
        if (regions.length > 1) {
            var to = currentRegion ? Number(currentRegion.start) - 0.01 > 0 ? Number(currentRegion.start) - 0.01 : 0 : 0;
            goTo(to);
        } else {
            wavesurfer.seekAndCenter(0);
        }
    },
    forward: function() {
        if (regions.length > 1) {
            goTo(currentRegion ? Number(currentRegion.end) + 0.01 : 1);
        } else {
            wavesurfer.seekAndCenter(1);
        }
    },
    mark: function() {
        var time = wavesurfer.getCurrentTime();
        if (time > 0) {
            var mark = addMarker(time);
            createRegion(mark.time);
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
            domUtils.appendHelpModalConfig(hModal, helpCurrentRegion);

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
    },
    annotate: function(elem) {
        var color = elem.data('color');
        var text = javascriptUtils.getSelectedText();
        if (text !== '') {
            manualTextAnnotation(text, 'accent-' + color);
        }
    },
    zip : function(){
      console.log(wId + ' ' + mrId );
      var url = Routing.generate('mediaresource_zip_export', {
          workspaceId: wId,
          id: mrId,
          data: regions
      });

      location.href = url;
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

    // toggle color on config region buttons if needed (if there are some help available on a region the button must be colored)
    toggleConfigButtonColor();

    // bind data-action events
    $("button[data-action]").click(function() {
        var action = $(this).data('action');
        if (actions.hasOwnProperty(action)) {
            actions[action]($(this));
        }
    });

    /* SWITCHES INPUTS */
    var toggleAnnotationCheck = $("[name='toggle-annotation-checkbox']").bootstrapSwitch('state', true);
    $(toggleAnnotationCheck).on('switchChange.bootstrapSwitch', function(event, state) {
        $('.annotation-buttons-container').toggle(transitionType);
        $(this).trigger('blur'); // remove focus to avoid spacebar interraction
    });


    // CONTENT EDITABLE CHANGE EVENT MAPPING
    $('body').on('focus', '[contenteditable]', function() {
        var $this = $(this);
        $this.data('before', $this.html());
        // when focused skip to the start of the region
        var start = $(this).closest(".row.form-row.region").find('input.hidden-start').val();
        goTo(start);
        isInRegionNoteRow = true;
        return $this;
    }).on('blur keyup paste input', '[contenteditable]', function(e) {
        var $this = $(this);
        if ($this.data('before') !== $this.html()) {
            $this.data('before', $this.html());
            $this.trigger('change');
            domUtils.updateHiddenNoteOrTitleInput($this);
            // @TODO update region note in array
        }
        return $this;
    }).on('blur', '[contenteditable]', function(e) {
        isInRegionNoteRow = false;
    });

    // HELP MODAL SELECT REGION (CURRENT / PREVIOUS) EVENT
    $('body').on('change', 'input[name=segment]:radio', function(e) {

        if (playing) {
            htmlAudioPlayer.pause();
            playing = false;
        }

        var selectedValue = e.target.value;
        if (selectedValue === 'previous') {
            domUtils.appendHelpModalConfig(hModal, helpPreviousRegion);
            helpRegion = {
                start: helpPreviousRegion.start + 0.1,
                end: helpPreviousRegion.end - 0.1
            };
        } else if (selectedValue === 'current') {
            domUtils.appendHelpModalConfig(hModal, currentRegion);
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
        initRegionsAndMarkers();
        if (regions.length > 0) {
            currentRegion = regions[0];
            domUtils.highlightRegionRow(currentRegion);
        }
    });

    wavesurfer.on('seek', function() {
        var current = getRegionFromTime();
        if (current && currentRegion && current.uuid != currentRegion.uuid) {
            // update current region
            currentRegion = current;
            // highlight region dom row
            domUtils.highlightRegionRow(currentRegion);
        }
    });

    wavesurfer.on('audioprocess', function() {
        // check regions and display text
        var current = getRegionFromTime();
        if (current && currentRegion && current.uuid != currentRegion.uuid) {
            // update current region
            currentRegion = current;
            // show help text
            domUtils.highlightRegionRow(currentRegion);
        }
    });
    /* /WAVESURFER */

    /* SAVE REGIONS FORM SUBMIT */
    $('#media-resource-regions-form').on('submit', function(e) {
        e.preventDefault();
        var url = $(this).attr('action');
        var type = $(this).attr('method');
        var data = $(this).serialize();
        $.ajax({
            url: url,
            type: type,
            data: data,
            success: function(response) {
                showSuccessFlashBag(response);
            },
            error: function(reponse) {
                showErrorFlashBag(response);
            }
        });
    });
    /* END SAVE REGIONS FORM SUBMIT */

    /* SAVE OPTIONS FORM SUBMIT */
    $('#mr-options-form').on('submit', function(e) {
        e.preventDefault();
        var url = $(this).attr('action');
        var type = $(this).attr('method');
        var data = $(this).serialize();
        $.ajax({
            url: url,
            type: type,
            data: data,
            success: function(response) {
                $('#mr-options-modal').modal('hide');
                showSuccessFlashBag(response);
                var lang = $('#media_resource_options_ttsLanguage').val();
                $('input[name=tts]').val(lang);
            },
            error: function(reponse) {
                $('#mr-options-modal').modal('hide');
                showErrorFlashBag(response);
            }
        });
    });
    /* /SAVE OPTIONS FORM SUBMIT */

});
// ======================================================================================================== //
// DOCUMENT READY END
// ======================================================================================================== //

// listen to resource options change to check rules
$('body').on('change', '#mr-options-form input:checkbox', function(e) {
    // at least one of these
    var oneIsChecked = $('input[name="media_resource_options[showAutoPauseView]"').prop('checked') === true || $('input[name="media_resource_options[showLiveView]"').prop('checked') === true || $('input[name="media_resource_options[showActiveView]"').prop('checked') === true || $('input[name="media_resource_options[showExerciseView]"').prop('checked') === true ? true : false;

    // if none is checked
    if (!oneIsChecked) {
        $('#mr-options-form-submit-btn').attr('disabled', true);
        $('#options-alert').fadeIn();
    } else {
        // hide alert and enable submit button
        $('#options-alert').fadeOut();
        $('#mr-options-form-submit-btn').attr('disabled', false);
    }
});

function showSuccessFlashBag(message) {
    var template = '<div class="alert alert-dismissable alert-success">';
    template += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
    template += message;
    template += '</div>';
    $('.alert-messages').empty();
    $('.alert-messages').append(template);
    $("html, body").animate({
        scrollTop: 0
    }, "slow");
}

function showErrorFlashBag(message) {
    $('.alert-messages').empty();
    var template = '<div class="alert alert-dismissable alert-danger">';
    template += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
    template += message;
    template += '</div>';
    $('.alert-messages').append(template);
    $("html, body").animate({
        scrollTop: 0
    }, "slow");
}

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

// create a new region "object" and create a new row in the dom
function createRegion(time){
  // each time we create a new region we have to split an existing one
  // find the region to split / update
  var toSplit = getRegionFromTime(time);
  // region to create after the given time
  var region = {
    start: Number(time),
    end: Number(toSplit.end),
    uuid: strUtils.createGuid(),
    note: '',
    hasHelp: false,
    helpUuid: '',
    loop: false,
    backward: false,
    rate: false,
    texts: false
  };
  // find corresponding dom row and update the end infos (in visible and hidden fields and )
  var $regionRow = domUtils.getRegionRow(toSplit.start, toSplit.end);
  // update "left" region in array
  toSplit.end = time;
  // update "left" region in DOM
  $regionRow.find('input.hidden-end').val(time);
  var hms = javascriptUtils.secondsToHms(toSplit.end);
  $regionRow.find('.end').text(hms);

  // add the "right" region row in the dom
  domUtils.addRegionToDom(region, javascriptUtils, $regionRow);
  regions.push(region);
}

// build markers, regions from existing ones
function initRegionsAndMarkers() {
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
            id: id,// @TODO check if still usefull
            uuid: uuid,
            start: Number(start),
            end: Number(end),
            note: note,
            hasHelp: hasHelp,
            helpUuid: helpUuid,
            loop: loop,
            backward: backward,
            rate: rate,
            texts: texts
        };
        regions.push(region);
        // create marker for each existing region
        if (Number(start) > 0) {
            addMarker(start, uuid);
        }

        var regionRow = domUtils.getRegionRow(start, end);
        var btn = $(regionRow).find('button.fa-trash-o');
        $(btn).attr('data-uuid', region.uuid);

    });
    if (regions.length === 0) {
        var region = {
            uuid: strUtils.createGuid(),
            start: 0,
            end: Number(wavesurfer.getDuration()),
            note: '',
            hasHelp: false,
            helpUuid: '',
            loop: false,
            backward: false,
            rate: false,
            texts: false
        };
        regions.push(region);
        // no region row yet so happend the new row to regions container
        var $appendTo = $('.regions-container');
        // add region row
        var regionRow = domUtils.addRegionToDom(region, javascriptUtils, $appendTo);
        var btn = $(regionRow).find('button.fa-trash-o');
        $(btn).attr('data-uuid', region.uuid);
        // @TODO add a message : "a default region has been created. Please save the changes before leaving the page"
    }
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


// ======================================================================================================== //
// CONFIG REGION MODAL FUNCTIONS
// ======================================================================================================== //
/**
 * Open config modal
 * @param the source of the event (button)
 */
function configRegion(elem) {
    var configModal = domUtils.openConfigRegionModal(elem);

    if (playing) {
        wavesurfer.pause();
        playing = false;
    }

    configModal.on('shown.bs.modal', function() {
      var uuid = $('#select-help-related-region :selected').val();
      currentHelpRelatedRegion = getRegionByUuid(uuid);
    });

    configModal.on('hidden.bs.modal', function() {
        currentHelpRelatedRegion = null;
        if (playing) {
            htmlAudioPlayer.pause();
            playing = false;
        }
        // color the config button if any value in config parameters
        toggleConfigButtonColor();
    });

    configModal.modal("show");
}

// @TODO for all modals event do the same...

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

/**
 * fired by ConfigRegion Modal <select> element (help related region)
 * @param {type} elem the source of the event
 **/
$('body').on('change', '#select-help-related-region', function(){
    // get region uuid
    var uuid = $(this).find(":selected").val();
    currentHelpRelatedRegion = getRegionByUuid(uuid);
    if (playing) {
        wavesurfer.pause();
        playing = false;
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




// ======================================================================================================== //
// MARKERS
// ======================================================================================================== //

/*
* Add a marker to the DOM and in collection
*/
function addMarker(time, uuid) {

    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();
    var cHeight = $canvas.height();

    var left = getMarkerLeftPostionFromTime(time);
    var markerWidth = 1;
    var dragHandlerBorderSize = 1;
    var dragHandlerSize = 18;
    var dragHandlerTop = cHeight / 2 - dragHandlerSize / 2;
    var dragHandlerLeft = dragHandlerBorderSize - dragHandlerSize / 2;

    var marker = document.createElement('div');
    marker.className = 'divide-marker';
    marker.style.left = left + 'px';
    marker.style.width = markerWidth + 'px';
    marker.dataset.time = time;

    var dragHandler = document.createElement('div');
    dragHandler.className = 'marker-drag-handler';
    dragHandler.style.border = dragHandlerBorderSize + 'px solid white';
    dragHandler.style.width = dragHandlerSize + 'px';
    dragHandler.style.height = dragHandlerSize + 'px';
    dragHandler.style.top = dragHandlerTop + 'px';
    dragHandler.style.left = dragHandlerLeft + 'px';
    dragHandler.title = Translator.trans('marker_drag_title', {}, 'media_resource');
    dragHandler.dataset.position = dragHandlerLeft;
    var guid = uuid || strUtils.createGuid();
    dragHandler.dataset.uuid = guid;

    marker.appendChild(dragHandler);
    $('#waveform').find('wave').first().append(marker);


    var dragData;
    // set the drag data when handler is clicked
    dragHandler.addEventListener('mousedown', function(event) {
        var time = getTimeFromPosition($(event.target).closest('.divide-marker').position().left);
        dragData = setDragData(time, marker);
    });

    $(marker).draggable({
        handle: ".marker-drag-handler",
        axis: "x",
        containment: "#waveform",
        drag: function() {
            var time = getTimeFromPosition($(this).position().left);
            // check obstacles
            if(dragData && dragData.minTime < time &&  dragData.maxTime > time ){
              updateTimeData(time, dragData);
            } else if (dragData && time > dragData.maxTime){
              // update data and slightly move marker left
              updateTimeData(time - 0.2, dragData);
              changeMarkerPosition(time - 0.2, dragData);
              return false;
            } else if (dragData && time < dragData.minTime){
              // update data and slightly move marker right
              updateTimeData(time + 0.2, dragData);
              changeMarkerPosition(time + 0.2, dragData);
              return false;
            }
        },
        stop: function() {
            var time = getTimeFromPosition($(this).position().left);
            updateTimeData(time, dragData);

        }
    });
    var mark = {
        time: time,
        uuid: guid
    };
    markers.push(mark);
    return mark;
}

/*
* While dragging we need to update some fields
* therefore we need to store some data
* marker is the dom marker
*/
function setDragData(time, marker) {
    var data = {};
    var hiddenEndToUpdate;
    var hiddenStartToUpdate;
    var endToUpdate;
    var startToUpdate;
    $('.region').each(function() {
        var start = Number($(this).find('input.hidden-start').val());
        var end = Number($(this).find('input.hidden-end').val());
        // first row to update (should update this row end value and hidden end value)
        if (time.toFixed(2) === end.toFixed(2)) {
            hiddenEndToUpdate = $(this).find('input.hidden-end');
            endToUpdate = $(this).find('.end');
        } else if (time.toFixed(2) === start.toFixed(2)) {
            hiddenStartToUpdate = $(this).find('input.hidden-start');
            startToUpdate = $(this).find('.start');
        }
    });
    // marker should not be moved before the previous nore after the next one
    var tolerance = 1;
    // since we are on a frontier, add / remove a little time to ensure next / prev search
    var prevRegion = getPrevRegion(time + 0.01);
    var nextRegion = getNextRegion(time - 0.01);
    var min = prevRegion && prevRegion.start ? prevRegion.start : 0;
    var max = nextRegion && nextRegion.end ? nextRegion.end : wavesurfer.getDuration();

    // search for marker object
    var markerObject;
    for(var i = 0; i < markers.length; i++ ){
      if(markers[i].time === time){
        markerObject = markers[i];
      }
    }

    data = {
        hiddenEndToUpdate: hiddenEndToUpdate,
        endToUpdate: endToUpdate,
        hiddenStartToUpdate: hiddenStartToUpdate,
        startToUpdate: startToUpdate,
        minTime: min + tolerance,
        maxTime: max - tolerance,
        prevRegion: prevRegion,
        nextRegion: nextRegion,
        marker: marker,
        markerO: markerObject
    };
    return data;
}

function getMarkerLeftPostionFromTime(time) {
    var duration = wavesurfer.getDuration();
    var $canvas = $('#waveform').find('wave').first().find('canvas').first();
    var cWidth = $canvas.width();
    return time * cWidth / duration;
}

/*
* update data while dragging
* should also update marker data-time value
*/
function updateTimeData(time, dragData) {
    $(dragData.startToUpdate).text(javascriptUtils.secondsToHms(time));
    $(dragData.hiddenStartToUpdate).val(time);

    // update region object data
    if(dragData.prevRegion){
      dragData.prevRegion.end = Number(time);
    }
    if(dragData.nextRegion){
      dragData.nextRegion.start = Number(time);
    }

    if (dragData.hiddenEndToUpdate && dragData.endToUpdate) {
        $(dragData.hiddenEndToUpdate).val(time);
        $(dragData.endToUpdate).text(javascriptUtils.secondsToHms(time));
    }

    // udpate dom marker data-time attribute
    dragData.marker.dataset.time = time;
    // udpate marker object time value
    dragData.markerO.time = time;
}

function changeMarkerPosition(time, dragData){
  // in case of moving the marker to some specific places, time attribute will be modified
  // so in any case reset the position of the marker
  var position = getMarkerLeftPostionFromTime(time);
  dragData.marker.style.left = position + 'px';
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

function removeRegionFromCollection(uuid){
  for(var i = 0 ; i < regions.length; i++){
    if(regions[i].uuid === uuid){
      regions.splice(i, 1);
    }
  }
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
 * Delete a region from the collection remove it from DOM and update times (start or end) of contiguous regions
 * Also handle corresponding marker deletion
 * @param elem the source of the event
 */
function deleteRegion(elem) {

    // can not delete region if just one ( = the default one) -> or not...
    if (regions.length === 1) {
        bootbox.alert(Translator.trans('alert_only_one_region_left', {}, 'media_resource'));
    } else {

        // get region to delete uuid
        var uuid = $(elem).data('uuid');
        if (uuid) {
            var toRemove = getRegionByUuid(uuid);
            var regionDomRow = $(elem).closest(".region");
            var regionUuid = $(regionDomRow).attr("data-uuid");
            var usedInHelp = domUtils.getRegionsUsedInHelp(regionUuid);
            var message = "<strong>" + Translator.trans('region_delete_confirm_base', {}, 'media_resource') + "</strong>";
            if (usedInHelp.length > 0) {
                message += '<hr/><div class="text-center"> ' + Translator.trans('region_delete_confirm_sub', {}, 'media_resource') + '</div>';
            }

            bootbox.confirm(message, function(result) {
                if (result) {
                    // remove help reference(s) if needed
                    if (usedInHelp.length > 0) {
                        for (var index = 0; index < usedInHelp.length; index++) {
                            var elem = usedInHelp[index];
                            // reset element value
                            $(elem).val('');
                        }
                    }

                    var start = Number(toRemove.start);
                    var end =  Number(toRemove.end);
                    // if we are deleting the first region
                    if (start === 0) {
                        var next = getNextRegion(end - 0.1);
                        if (next) {
                            next.start = 0;
                            // update time (DOM)
                            var hiddenInputToUpdate = regionDomRow.next().find("input.hidden-start");
                            hiddenInputToUpdate.val(start);
                            var divToUpdate = regionDomRow.next().find(".time-text.start");
                            divToUpdate.text(javascriptUtils.secondsToHms(start));

                        } else {
                            console.log('not found');
                        }
                    } else { // all other cases
                        // get previous region and update it's end
                        var previous = getPrevRegion(start + 0.1);
                        if (previous) {
                            previous.end = end;
                            // update time (DOM)
                            var hiddenInputToUpdate = regionDomRow.prev().find("input.hidden-end");
                            hiddenInputToUpdate.val(end);
                            var divToUpdate = regionDomRow.prev().find(".time-text.end");
                            divToUpdate.text(javascriptUtils.secondsToHms(end));
                        } else {
                            console.log('not found');
                        }
                    }
                    // update region array
                    removeRegionFromCollection(uuid);
                    // remove region DOM row
                    $(regionDomRow).remove();
                    // remove marker from DOM
                    $('.marker-drag-handler').each(function() {
                      var $marker = $(this).closest('.divide-marker');
                      var time =  Number($marker.attr('data-time'));
                      if(time === start){
                        $marker.remove();
                      }
                    });
                    // remove marker from array
                    for(var i = 0; i < markers.length; i++ ){
                      if(markers[i].time === start){
                        markers.splice(i,1);
                      }
                    }
                    console.log('after deletion regions + markers are updated ?');
                    console.log(regions);
                    console.log(markers);
                }
            });
        }
    }
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


/**
 * Add a color to region config button if any config parameter found for the row
 */
function toggleConfigButtonColor() {
    $('.region').each(function() {
        if (checkIfRowHasConfigValue($(this))) {
            $(this).find('.fa.fa-cog').addClass('btn-warning').removeClass('btn-default');
        } else {
            $(this).find('.fa.fa-cog').removeClass('btn-warning').addClass('btn-default');
        }
    });
}

function manualTextAnnotation(text, css) {
    if (!css) {
        document.execCommand('insertHTML', false, css);
    } else {
        document.execCommand('insertHTML', false, '<span class="' + css + '">' + text + '</span>');
    }
}

// ======================================================================================================== //
//  OTHER MIXED FUNCTIONS END
// ======================================================================================================== //
