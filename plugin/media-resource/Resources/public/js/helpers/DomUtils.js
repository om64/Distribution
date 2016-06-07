'use strict';

var DomUtils = {
    /**
     * Open help for a region
     * @param object current : current region
     * @param object previous : previous (relatively to current) region can be null
     * @returns bootbox modal object
     */
    openRegionHelpModal: function (current, previous) {
        var html = '<div id="help-tab-panel" role="tabpanel">';
        html += '       <ul class="nav nav-tabs" role="tablist">';
        html += '           <li role="presentation" class="active">';
        html += '               <a href="#help-region-choice" aria-controls="help-region-choice" role="tab" data-toggle="tab">' + Translator.trans('help_modal_choice_tab_label', {}, 'media_resource') + '</a>';
        html += '           </li>';
        html += '           <li role="presentation">';
        html += '               <a href="#region-help-available" aria-controls="region-help-available" role="tab" data-toggle="tab">' + Translator.trans('help_modal_help_tab_label', {}, 'media_resource') + '</a>';
        html += '           </li>';
        html += '       </ul>';
        html += '       <div class="tab-content">';
        //                  FIRST PANE
        html += '           <div role="tabpanel" class="tab-pane active" id="help-region-choice">';
        html += '               <div class="row">';
        html += '                   <div class="col-md-12 text-center">';
        html += Translator.trans('help_modal_intro', {}, 'media_resource');
        html += '                   </div>';
        html += '               </div>';
        html += '               <hr/>';
        //                      CURRENT REGION
        html += '               <div class="form-inline">';
        html += '                   <div class="form-group">';
        html += '                       <div class="input-group">';
        html += '                           <label class="input-group-addon" style="width:250px;">' + Translator.trans('current_segment', {}, 'media_resource') + '</label>';
        html += '                           <div class="input-group-addon">';
        html += '                               <input type="radio" name="segment" value="current" checked>';
        html += '                           </div>';
        html += '                           <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback', {}, 'media_resource') + '"  onclick="playHelp(' + current.start + ', ' + current.end + ', ' + false + ',' + false + ')" style="margin:5px;">';
        html += '                               <i class="fa fa-play"></i> ';
        html += '                               / ';
        html += '                               <i class="fa fa-pause"></i>';
        html += '                           </button>';
        html += '                       </div>';
        html += '                   </div>';
        html += '               </div>';
        //                      PREVIOUS REGION
        if (previous) {
            html += '           <hr/>';
            html += '           <div class="form-inline">';
            html += '               <div class="form-group">';
            html += '                   <div class="input-group">';
            html += '                       <label class="input-group-addon" style="width:250px;">' + Translator.trans('previous_segment', {}, 'media_resource') + '</label>';
            html += '                       <div class="input-group-addon">';
            html += '                           <input type="radio" name="segment" value="previous">';
            html += '                       </div>';
            html += '                       <button disabled class="btn btn-default" title="' + Translator.trans('region_help_segment_playback', {}, 'media_resource') + '" onclick="playHelp(' + previous.start + ', ' + previous.end + ', ' + false + ',' + false + ')" style="margin:5px;">';
            html += '                           <i class="fa fa-play"></i> ';
            html += '                           / ';
            html += '                           <i class="fa fa-pause"></i>';
            html += '                       </button>';
            html += '                   </div>';
            html += '               </div>';
            html += '           </div>';
        }
        html += '            </div>'; // END OF FIRST PANE
        //                  SECOND PANE = Available help for selected region (current or previous)
        html += '           <div role="tabpanel" class="tab-pane" id="region-help-available">';
        html += '           </div>';
        html += '       </div>';
        html += '   </div>';

        var modal = bootbox.dialog({
            title: Translator.trans('region_help', {}, 'media_resource'),
            message: html,
            show: false,
            buttons: {
                success: {
                    label: Translator.trans('close', {}, 'media_resource'),
                    className: "btn-default",
                    callback: function () {

                    }
                }
            }
        });
        return modal;
    },
    /**
     * Allow author to set witch help will be available for the region
     * @param {type} elem current clicked config button
     */
    openConfigRegionModal: function (elem) {
        // get regions dom rows
        var rRows = [];
        $('.region').each(function () {
            var row = {};
            row = {
                uid: $(this).data('uuid'),
                hstart: $(this).find('.time-text.start').text(),
                hend: $(this).find('.time-text.end').text(),
                start: $(this).find('input.hidden-start').val(),
                end: $(this).find('input.hidden-end').val()
            };
            rRows.push(row);

        });
        // get current region row start text
        var currentStart = $(elem).closest('div.region').find('.time-text.start').text();
        // find region config hidden inputs
        //help-region-id -> problem is that the id might not exist (for newly created regions) -> need to select a region by time ?
        var helpRegionUuid = $(elem).closest('div.region').find('.hidden-config-help-region-uuid');
        //loop elem
        var loop = $(elem).closest('div.region').find('.hidden-config-loop');
        //backward
        var backward = $(elem).closest('div.region').find('.hidden-config-backward'); //$('input[name=backward]').is(':checked');
        //rate
        var rate = $(elem).closest('div.region').find('.hidden-config-rate');
        //text
        var text = $(elem).closest('div.region').find('.hidden-config-text');

        var html = '';
        html += '<div class="row">';
        html += '   <div class="col-md-12">';
        html += '       <div class="form">';
        html += '           <div class="checkbox">';
        html += '               <label>';
        if (loop.val() === '1')
            html += '               <input type="checkbox" name="loop"  value="loop" checked>';
        else
            html += '               <input type="checkbox" name="loop" value="loop">';
        html += Translator.trans('region_config_allow_loop', {}, 'media_resource');
        html += '               </label>';
        html += '           </div>';
        html += '           <div class="checkbox">';
        html += '               <label>';
        if (backward.val() === '1')
            html += '               <input type="checkbox" name="backward" value="backward" checked>';
        else
            html += '               <input type="checkbox" name="backward" value="backward">';
        html += Translator.trans('region_config_allow_bwb', {}, 'media_resource');
        html += '               </label>';
        html += '           </div>';
        html += '           <div class="checkbox">';
        html += '               <label>';
        if (rate.val() === '1')
            html += '               <input type="checkbox" name="rate" value="rate" checked>';
        else
            html += '               <input type="checkbox" name="rate" value="rate">';
        html += Translator.trans('region_config_allow_rate', {}, 'media_resource');//'               Autoriser le changement de la vitesse de lecture';
        html += '               </label>';
        html += '           </div>';
        html += '           <hr/>';
        // help text
        html += '           <div class="form-group">';
        html += '               <label class="col-md-4 control-label" for="has-rate">' + Translator.trans('region_config_help_text', {}, 'media_resource') + '</label>';
        html += '               <input type="text" name="help-text" style="max-width:225px;" class="form-control" value="' + text.val() + '">';
        html += '           </div>';
        html += '           <hr/>';
        // region dropdown
        html += '           <div class="form-group">';
        html += '               <label class="col-md-4 control-label" for="has-rate">' + Translator.trans('region_config_help_region_title', {}, 'media_resource') + '</label>';
        html += '               <select name="region" id="select-help-related-region">';
        html += '                   <option value="-1">' + Translator.trans('none', {}, 'media_resource') + '</option>';
        // loop
        for (var i = 0; i < rRows.length; i++) {
            // we do not want the current region to appear in this list
            if (currentStart !== rRows[i].hstart) {
                var selected = '';
                if (helpRegionUuid.val() === rRows[i].uid) {
                    selected = 'selected';
                    var time = Number(rRows[i].start) + 0.1;
                }
                html += '           <option value="' + rRows[i].uid + '" ' + selected + '>' + rRows[i].hstart + ' - ' + rRows[i].hend + '</option>';
            }
        }
        html += '               </select>';
        html += '               <button class="btn btn-default" id="btn-help-related-region-play" style="margin:5px;">';
        html += '               <i class="fa fa-play"></i> ';
        html += '                / ';
        html += '               <i class="fa fa-pause"></i>';
        html += '               </button>';
        html += '           </div>';
        html += '       </div>'; // end form
        html += '   </div>'; // end col
        html += '</div>'; // end row

        var modal = bootbox.dialog({
            title: Translator.trans('dialog_region_configure', {}, 'media_resource'),
            message: html,
            buttons: {
                success: {
                    label: Translator.trans('close', {}, 'media_resource'),
                    className: "btn-default",
                    show: false,
                    callback: function () {
                        // get form values
                        var helpText = $('input[name=help-text]').val();
                        var hasLoop = $('input[name=loop]').is(':checked');
                        var hasBackward = $('input[name=backward]').is(':checked');
                        var hasRate = $('input[name=rate]').is(':checked');
                        var helpId = $("#region-select").val();
                        // set proper hidden inputs values
                        text.val(helpText);
                        rate.val(hasRate ? '1' : '0');
                        backward.val(hasBackward ? '1' : '0');
                        loop.val(hasLoop ? '1' : '0');
                        if (helpId != -1)
                            helpRegionUuid.val(helpId);
                        else {
                            helpRegionUuid.val('');
                        }
                    }
                }
            }
        });
        return modal;
    },
    appendHelpModalConfig: function (modal, region) {
        var root = $(modal).find('#region-help-available');
        $(root).empty();
        var html = '<hr/>';
        if (region.hasHelp) {
            if (region.loop) {
                html += '<div class="row">';
                html += '   <div class="col-md-12">';
                html += '       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback_loop', {}, 'media_resource') + '"  onclick="playHelp(' + region.start + ', ' + region.end + ', ' + true + ',' + false + ')" style="margin:5px;">';
                html += '           <i class="fa fa-retweet"></i> ';
                html += '       </button>';
                html += '       <label>' + Translator.trans('region_help_segment_playback_loop', {}, 'media_resource') + '</label>';
                html += '   </div>';
                html += '</div>';
            }
            if (region.backward) {
                html += '<hr/>';
                html += '<div class="row">';
                html += '   <div class="col-md-12">';
                html += '       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback_backward', {}, 'media_resource') + '" onclick="playBackward();" style="margin:5px;">';
                html += '           <i class="fa fa-exchange"></i> ';
                html += '       </button>';
                html += '       <label>' + Translator.trans('region_help_segment_playback_backward', {}, 'media_resource') + '</label>';
                html += '   </div>';
                html += '</div>';
            }
            if (region.rate) {
                html += '<hr/>';
                html += '<div class="row">';
                html += '   <div class="col-md-12">';
                html += '       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback_rate', {}, 'media_resource') + '"  onclick="playHelp(' + region.start + ', ' + region.end + ', ' + false + ',' + true + ')">x0.8</button>';
                html += '       <label>' + Translator.trans('region_help_segment_playback_rate', {}, 'media_resource') + '</label>';
                html += '   </div>';
                html += '</div>';
            }
            if (region.texts.length > 0) {
                html += '<hr/>';
                html += '<div class="row">';
                html += '   <div class="col-md-12">';
                html += '       <button id="btn-show-help-text" class="btn btn-default" title="' + Translator.trans('region_help_related_segment_playback', {}, 'media_resource') + '" style="margin:5px;">';
                html += Translator.trans('region_help_help_text_label', {}, 'media_resource');
                html += '       </button>';
                html += '       <label id="help-modal-help-text" style="margin:5px;display:none;"></label>';
                html += '   </div>';
                html += '</div>';
            }
            if (region.relatedRegionUuid) {
                var helpRegionStart = this.getHelpRelatedRegionStart(region.relatedRegionUuid);
                html += '<hr/>';
                html += '<div class="row">';
                html += '   <div class="col-md-12">';
                html += '       <button class="btn btn-default" title="' + Translator.trans('region_help_related_segment_playback', {}, 'media_resource') + '" onclick="playHelpRelatedRegion( ' + helpRegionStart + ');" style="margin:5px;">';
                html += '           <i class="fa fa-play"></i> ';
                html += '           / ';
                html += '           <i class="fa fa-pause"></i>';
                html += '       </button>';
                html += '       <label>' + Translator.trans('region_help_related_segment_playback', {}, 'media_resource') + '</label>';
                html += '   </div>';
                html += '</div>';
            }

        }
        else {
            html += '<div class="row">';
            html += '   <div class="col-md-12">';
            html += '       <h4>' + Translator.trans('region_help_no_help_available', {}, 'media_resource') + '</h4>';
            html += '   </div>';
            html += '</div>';
        }
        $(html).appendTo(root);
        var currentLevel = 0;
        $("#btn-show-help-text").on('click', function(){
            $('#help-modal-help-text').hide();
            currentLevel = currentLevel === region.texts.length ? 0:currentLevel;
            $('#help-modal-help-text').text(region.texts[currentLevel]);
            currentLevel++;
            $('#help-modal-help-text').show();
        });
    },
    /**
    * region current region to create
    * utils
    * appendTo dom row jquery object the row after witch we need to add the new region row
    */
    addRegionToDom: function (region, javascriptUtils, $appendTo) {

        // HTML to append
        var html = '';
        html += '<div class="row form-row region" id="' + region.uuid + '" data-uuid="' + region.uuid + '">';
        // start input
        html += '       <div class="col-xs-1 text-center">';
        html += '           <div class="time-text start">' + javascriptUtils.secondsToHms(region.start) + '</div>';
        html += '       </div>';
        // end input
        html += '       <div class="col-xs-1 text-center">';
        html += '           <div class="time-text end">' + javascriptUtils.secondsToHms(region.end) + '</div>';
        html += '       </div>';
        // text input
        html += '       <div class="col-xs-8">';
        html += '           <div contenteditable="true" class="text-left note">' + region.note + '</div>';
        html += '       </div>';
        // delete button
        html += '       <div class="col-xs-2">';
        html += '           <div class="btn-group" role="group">';
        html += '               <button type="button" class="btn btn-default fa fa-play" title="' + Translator.trans('play_pause', {}, 'media_resource') + '" onclick="playRegion(this);">';
        html += '               <button role="button" type="button" class="btn btn-default fa fa-cog" title="' + Translator.trans('region_config', {}, 'media_resource') + '" onclick="configRegion(this);"> </button>';
        html += '               <button type="button" name="del-region-btn" class="btn btn-danger fa fa-trash-o" data-uuid="' + region.uuid + '" title="' + Translator.trans('region_delete', {}, 'media_resource') + '" onclick="deleteRegion(this)"></button>';
        html += '           </div>';
        html += '       </div>';
        // Hidden fields
        html += '       <input type="hidden" class="hidden-start" name="start[]" value="' + region.start + '" required="required">';
        html += '       <input type="hidden" class="hidden-end" name="end[]" value="' + region.end + '" required="required">';
        html += '       <input type="hidden" class="hidden-note" name="note[]" value="' + region.note + '">';
        html += '       <input type="hidden" class="hidden-region-id" name="region-id[]" value="" >';
        html += '       <input type="hidden" class="hidden-region-uuid" name="region-uuid[]" value="' + region.uuid + '" >';

        html += '       <input type="hidden" class="hidden-config-help-region-uuid" name="help-region-uuid[]" value="" >';
        html += '       <input type="hidden" class="hidden-config-loop" name="loop[]" value="0" >';
        html += '       <input type="hidden" class="hidden-config-backward" name="backward[]" value="0" >';
        html += '       <input type="hidden" class="hidden-config-rate" name="rate[]" value="0" >';
        html += '       <input type="hidden" class="hidden-config-text" name="text[]" value="" >';
        html += '</div>';

        // append the row in the right place
        $(html).insertAfter($appendTo);
    },
    /**
     * get regions that are using the given regionUuid as help region
     * @param {type} uuid the region uuid
     * @returns {Array of region uuid}
     */
    getRegionsUsedInHelp: function (uuid) {
        var results = [];
        // for each region row
        $('.region').each(function () {
            // if one or more region have the hidden input setted the deleted region is used in help
            var searched = $(this).find('input.hidden-config-help-region-uuid').val();
            if (searched == uuid) {
                // push the input in result array
                results.push(searched);
            }
        });
        return results;
    },
    /**
     * For a given region uuid, find the dom row, find the region start info
     * @param string rowUuid
     * @returns region start value
     */
    getHelpRelatedRegionStart: function (rowUuid) {
        return Number($('#' + rowUuid).find('.hidden-start').val());
    },
    /**
     * Get the region associatied row (ie DOM object)
     * @param start
     * @param end
     * @returns the row
     */
    getRegionRow: function (start, end) {
        var row;
        $('.region').each(function () {
            var temp = $(this);
            // current row start
            var sinput = $(this).find("input.hidden-start");
            // current row end
            var einput = $(this).find("input.hidden-end");
            if (start && end && Number(sinput.val()) <= Number(start) && Number(einput.val()) >= Number(end)) {
                row = temp;
            }
            else if (!end && start && Number(sinput.val()) === Number(start)) {
                row = temp;
            }
            else if (!start && end && Number(einput.val()) === Number(end)) {
                row = temp;
            }
        });
        return row;
    },
    /**
     * Highlight a row
     * @param region
     */
    highlightRegionRow: function (region) {
        var row = this.getRegionRow(region.start + 0.1, region.end - 0.1);
        if (row) {
            $('.active-row').each(function () {
                $(this).removeClass('active-row');
            });
            $(row).find('div.text-left.note').addClass('active-row');
        }
    },
    /**
     * Upadte Hidden inputs values for contenteditable=true divs (ie region notes divs and title div)
     * @param {type} elem
     * @returns {undefined}
     */
    updateHiddenNoteOrTitleInput: function (elem) {
        // get last css class name of the element
        var isNote = $(elem).hasClass('note');
        if (isNote) {
            // find associated input[name="note"] input and set val
            var hiddenNoteInput = $(elem).closest(".region").find('input.hidden-note');
            var content = $(elem).html() ? $(elem).html() : $(elem).text();
            $(hiddenNoteInput).val(content);
        }
        else {
            var hiddenTitleInput = $(elem).closest('.row').find('input[name=title]');
            $(hiddenTitleInput).val($(elem).text());
        }
    },
    /**
     * Open help for a region for active listening (very simple help modal compared to the full one)
     * @param object current : current wavesurfer region
     * @param string audioData : current media audio url
     * @returns bootbox modal object
     */
    openSimpleHelpModal: function (current, audioData) {
        var html = '<div class="row">';
        html += '       <div class="col-md-12 text-center">';
        html += '           <audio id="help-audio-player" src="' + audioData + '"></audio>'; // will not show as no controls are defined
        html += '           <div class="row">';
        html += '               <div class="col-md-12">';
        html += '                   <div class="btn-group">';
        html += '                       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback', {}, 'media_resource') + '" onclick="playHelp(' + current.start + ', ' + current.end + ', ' + false + ',' + false + ')">';
        html += '                           <i class="fa fa-play"></i> ';
        html += '                           / ';
        html += '                           <i class="fa fa-pause"></i>';
        html += '                       </button>';
        html += '                       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback_loop', {}, 'media_resource') + '"  onclick="playHelp(' + current.start + ', ' + current.end + ', ' + true + ', ' + false + ')">';
        html += '                           <i class="fa fa-retweet"></i> ';
        html += '                       </button>';
        html += '                       <button class="btn btn-default" title="' + Translator.trans('region_help_segment_playback_rate', {}, 'media_resource') + '"  onclick="playHelp(' + current.start + ', ' + current.end + ', ' + false + ',' + true + ')">x0.8</button>';
        html += '                   </div>';
        html += '               </div>';
        html += '           </div>';
        html += '       </div>';
        html += '</div>';

        var modal = bootbox.dialog({
            title: Translator.trans('region_help', {}, 'media_resource'),
            message: html,
            show: true,
            buttons: {
                success: {
                    label: Translator.trans('close', {}, 'media_resource'),
                    className: "btn-default",
                    callback: function () {

                    }
                }
            }
        });
        return modal;
    },
};
