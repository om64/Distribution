/**
 *
 * @param {StepConditionsService} StepConditionsService
 * @param {CriterionService} CriterionService
 * @param {ConfirmService} ConfirmService
 *
 * @constructor
 */
var StepConditionsEditCtrl = function StepConditionsEditCtrl(StepConditionsService, CriterionService, ConfirmService) {
    console.log('initialize condition');
    this.webDir = AngularApp.webDir;

    // Inject service
    this.confirmService         = ConfirmService;
    this.stepConditionsService  = StepConditionsService;
    this.CriterionService       = CriterionService;

    //    this.evaluation[step.id] = this.stepConditionsService.getEvaluationFromController(step.activityId);

    //get the current condition
    this.conditionstructure = [];
    if (angular.isObject(this.step.condition)) {
        this.conditionstructure = [this.step.condition];
    }

    //TODO : Make it work, to use in conditions
    //    this.CriteriaService.getEvaluations();

    this.CriterionService.getUserGroups().then(function(result) {
        this.useringroup = result;
    }.bind(this));

    this.CriterionService.getGroups().then(function(result) {
        this.criterionUsergroup = result;
    }.bind(this));

    this.CriterionService.getTeams().then(function(result) {
        this.criterionUserteam = result;
    }.bind(this));

    this.CriterionService.getActivityStatuses().then(function(result) {
        this.criterionActivitystatuses = result;
    }.bind(this));
};

// Set up dependency injection
StepConditionsEditCtrl.$inject = [
    'StepConditionsService',
    'CriterionService',
    'ConfirmService'
];

/**
 * Current step
 * @type {object}
 */
StepConditionsEditCtrl.prototype.step = null;

/**
 * Path to the symfony web directory (where are stored our partials)
 * @type {null}
 */
StepConditionsEditCtrl.prototype.webDir = null;

/**
 * Structure of the current condition
 * @type {object}
 */
StepConditionsEditCtrl.prototype.conditionstructure = [];

/**
 * Current Step
 * @type {Object}
 */
StepConditionsEditCtrl.prototype.step = {};

/**
 * Step which will be locked
 * @type {Object}
 */
StepConditionsEditCtrl.prototype.next = {};

/**
 * Create a new condition for a given step
 */
StepConditionsEditCtrl.prototype.createCondition = function createCondition() {
    this.conditionstructure = [];
    this.conditionstructure.push(this.stepConditionsService.initialize(this.step));
};

/**
 * Delete a condition
 */
StepConditionsEditCtrl.prototype.deleteCondition = function deleteCondition() {
    this.confirmService.open(
        // Confirm options
        {
            title:         Translator.trans('condition_delete_title',   {}, 'path_wizards'),
            message:       Translator.trans('condition_delete_confirm', {}, 'path_wizards'),
            confirmButton: Translator.trans('condition_delete',         {}, 'path_wizards')
        },

        // Confirm success callback
        function () {
            //remove the condition (needs to be step.condition to trigger change and allow path save)
            this.step.condition = null;
            this.conditionstructure = [];
        }.bind(this)
    );
};

/**
 * Adds a criteria group to the condition
 * @param criteriagroup
 */
StepConditionsEditCtrl.prototype.addCriteriagroup = function(criteriagroup) {
    //use the service method to add a new criteriagroup
    this.stepConditionsService.addCriteriagroup(criteriagroup);
};

/**
 * Adds a criterion to the condition
 */
StepConditionsEditCtrl.prototype.addCriterion = function addCriterion(criteriagroup) {
    //use the service method to add a new criterion
    this.stepConditionsService.addCriterion(criteriagroup);
};

/**
 * Delete a criteria group (and its children)
 */
StepConditionsEditCtrl.prototype.removeCriteriagroup = function removeCriteriagroup(group) {
    this.confirmService.open(
        // Confirm options
        {
            title:         Translator.trans('criteriagroup_delete_title',   {}, 'path_wizards'),
            message:       Translator.trans('criteriagroup_delete_confirm', {}, 'path_wizards'),
            confirmButton: Translator.trans('criteriagroup_delete',         {}, 'path_wizards')
        },

        // Confirm success callback
        function () {
            //use the service method to add a remove a criteriagroup
            this.stepConditionsService.removeCriteriagroup(this.conditionstructure[0].criteriagroups, group);
        }.bind(this)
    );
};

/**
 * Delete a criterion
 */
StepConditionsEditCtrl.prototype.removeCriterion = function removeCriterion(group, index) {
    this.confirmService.open(
        // Confirm options
        {
            title:         Translator.trans('criterion_delete_title',   {}, 'path_wizards'),
            message:       Translator.trans('criterion_delete_confirm', {}, 'path_wizards'),
            confirmButton: Translator.trans('criterion_delete',         {}, 'path_wizards')
        },

        // Confirm success callback
        function () {
            //remove the criterion
            group.criterion.splice(index, 1);
        }.bind(this)
    );
};