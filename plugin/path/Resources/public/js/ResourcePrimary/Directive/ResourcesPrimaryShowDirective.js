/**
 * Manages Primary Resources
 */
(function () {
    'use strict';

    angular.module('ResourcePrimaryModule').directive('resourcesPrimaryShow', [
        function ResourcesPrimaryEditDirective() {
            return {
                restrict: 'E',
                replace: true,
                controller: ResourcesPrimaryShowCtrl,
                controllerAs: 'resourcesPrimaryShowCtrl',
                template: '<iframe style="min-height: {{ resourcesPrimaryShowCtrl.height }}px;" data-ng-src="{{ resourcesPrimaryShowCtrl.resourceUrl.url }}" allowfullscreen></iframe>',
                scope: {
                    resources : '=', // Resources of the Step
                    height    : '='  // Min height for Resource display
                },
                bindToController: true,
                link: function (scope, element, attr) {
                    var iframeChangeTimeout = null;

                    var resizeIframe = function (element) {
                        var height = element.find('body').first().height();

                        if (height) {
                            element.css('height', height + 15);
                        }
                    };

                    // Manage the height of the iFrame
                    element.on('load', function () {
                        var iframe = this;
                        setTimeout(function () {
                            resizeIframe(iframe);
                        }, 50);
                    });

                    $(window).on('resize', function () {
                        clearTimeout(iframeChangeTimeout);
                        iframeChangeTimeout = setTimeout(function () {
                            element.each(function (el) {
                                resizeIframe(el);
                            });
                        }, 300);
                    });

                    clearTimeout(iframeChangeTimeout);
                    iframeChangeTimeout = setTimeout(function () {
                        element.each(function () {
                            resizeIframe(element);
                        });
                    }, 300);
                }
            };
        }
    ]);
})();
