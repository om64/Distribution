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

$(document).ready(function() {
    // get some hidden inputs usefull values
    currentExerciseType = 'audio';

    domUtils = Object.create(DomUtils);
    wId = $('input[name="wId"]').val();
    mrId = $('input[name="mrId"]').val();

    createRegions();
    currentRegion = regions[0];
    $('.help-text').html(currentRegion.note);
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
    /*wavesurfer.initMinimap({
        height: 30,
        waveColor: '#ddd',
        progressColor: '#999',
        cursorColor: '#999'
    });*/

    audioUrl = Routing.generate('innova_get_mediaresource_resource_file', {
        workspaceId: wId,
        id: mrId
    });
    helpAudioPlayer = document.getElementById('html-audio');
    helpAudioPlayer.src = audioUrl;
    wavesurfer.load(audioUrl);

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
            helpAudioPlayer.pause();
            helpAudioPlayer.currentTime = 0;
            playing = false;
            wavesurfer.setVolume(1);
            wavesurfer.setPlaybackRate(1);
        }
        $('#btn-play').removeClass('fa-pause').addClass('fa-play');
        var current = getRegionFromCurrentTime();
        if (current && current.id != currentRegion.id) {
            // update current region
            currentRegion = current;
            // show help text
            $('.help-text').html(currentRegion.note);
        }

        if (helpRegion && current.id != helpRegion.id) {
            console.log('hide help items');
            $('.region-highlight').remove();
            $('.help-container').hide();
        }
    });

    wavesurfer.on('audioprocess', function() {
        // check regions and display text
        var current = getRegionFromCurrentTime();
        if (current && current.id != currentRegion.id) {
            // update current region
            currentRegion = current;
            // show help text
            $('.help-text').html(currentRegion.note);
        }
    });
    /* /WAVESURFER */
});

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
    helpAudioPlayer.pause();
    helpAudioPlayer.currentTime = 0;
    wavesurfer.playPause();
    playing = playing ? false : true;
    if (playing) {
        $('#btn-play').removeClass('fa-play').addClass('fa-pause');
        $('.region-highlight').remove();
        $('.help-container').hide();
    } else {
        // show available help if any
        $('#btn-play').removeClass('fa-pause').addClass('fa-play');
        highlight();
        showHelp();
    }
}

// play with auto pause
function autoPause() {
    // get region from current time
    // play the region from current time until the end of the region
    // get next region if any
    // play the region from current time until the end of the region

}

function playInLoop() {
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
    wavesurfer.setPlaybackRate(0.8);
    wavesurfer.setVolume(0);
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
    if (playing) {
        playing = false;
        wavesurfer.pause();
        wavesurfer.clearRegions();
        wavesurfer.setPlaybackRate(1);
        helpAudioPlayer.pause();
        wavesurfer.setVolume(1);
    } else {
        region.play();
        helpAudioPlayer.playbackRate = 0.8;
        helpAudioPlayer.currentTime = helpRegion.start;
        helpAudioPlayer.play();
        playing = true;
        region.on('out', function() {
            playing = false;
            wavesurfer.pause();
            var progress = helpRegion.start / wavesurfer.getDuration();
            wavesurfer.seekTo(progress);
            wavesurfer.clearRegions();
            wavesurfer.setPlaybackRate(1);
            wavesurfer.setVolume(1);
            helpAudioPlayer.playbackRate = 1;
            helpAudioPlayer.pause();
            helpAudioPlayer.currentTime = helpRegion.start;
        });
    }
}


function showHelp() {
    console.log('show me the help please');
    var current = getRegionFromCurrentTime();
    var $root = $('.help-container');
    $root.empty();
    $root.show();
    var html = '';
    if (current.hasHelp) {
        if (current.loop) {
            html += '<button class="btn btn-default fa fa-retweet help-item" title="' + Translator.trans('region_help_segment_playback_loop', {}, 'media_resource') + '"  onclick="playInLoop()">';
            html += '</button>';
        }
        if (current.backward) {
            html += '<button class="btn btn-default fa fa-exchange help-item" title="' + Translator.trans('region_help_segment_playback_backward', {}, 'media_resource') + '" onclick="playBackward();">';
            html += '</button>';
        }
        if (current.rate) {
            html += '<button class="btn btn-default help-item" title="' + Translator.trans('region_help_segment_playback_rate', {}, 'media_resource') + '"  onclick="playSlowly()">x0.8</button>';
        }
        if (current.texts.length > 0) {
            console.log(current.texts);
            for (var i = 0; i < current.texts.length; i++) {
              if(current.texts[i] !== ''){
                  html += '<button class="btn btn-default fa fa-file-text-o help-item" title="' + current.texts[i] + '">';
                  html += '</button>';
              }
            }
        }
    } else {
        html += '<h4>' + Translator.trans('region_help_no_help_available', {}, 'media_resource') + '</h4>';
    }
    $root.append(html);
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
        var texts = $(this).find('input.hidden-config-text').val() !== '' ? $(this).find('input.hidden-config-text').val().split(';'):false;
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
    return true;
}
