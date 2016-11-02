import DefineMap from 'can-define/map/map';
import DefineList from 'can-define/list/list';
import Component from 'can-component';
import template from './template.stache!';
import batch from 'can-event/batch/batch';
import assign from 'can-util/js/assign/assign';
import './widget.less!';

import vm from 'can-view-model';
window.vm = vm;
import '../list-table/';
import '../property-table/';
import '../form-widget/';
import '../filter-widget/';
import '../paginate-widget/';
import '../nav-container/nav-container';


// import 'can-ui/modal-container/';
// import 'can-ui/tab-container/';
// import 'can-ui/panel-container/';

import {FilterList} from '../filter-widget/Filter';
import {parseFieldArray, mapToFields} from '../util/field';
import {ViewMap} from './ViewMap';

export const TOPICS = {
  /**
   * Topic to add a new message when an object is modified or deleted. The topic
   * published is `addMessage`
   * @property {String} data-admin.ViewModel.topics.ADD_MESSAGE
   * @parent data-admin.ViewModel.topics
   */
    ADD_MESSAGE: 'addMessage',
  /**
   * topic to clear existing messages. The topic
   * published is `clearMessages`
   * @property {String} data-admin.ViewModel.topics.CLEAR_MESSAGES
   * @parent data-admin.ViewModel.topics
   */
    CLEAR_MESSAGES: 'clearMessages'
};

const DEFAULT_BUTTONS = [{
    iconClass: 'fa fa-list-ul',
    eventName: 'view',
    title: 'View Row Details'
}];
const EDIT_BUTTONS = DEFAULT_BUTTONS.concat([{
    iconClass: 'fa fa-pencil',
    eventName: 'edit',
    title: 'Edit Row'
}, {
    iconClass: 'fa fa-trash',
    eventName: 'delete',
    title: 'Remove Row'
}]);

export const SortMap = DefineMap.extend('SortMap', {
    fieldName: null,
    type: 'asc'
});

export const ParameterMap = DefineMap.extend('ParameterMap', {
    filters: {Type: FilterList, Value: FilterList},
    perPage: {type: 'number', value: 10},
    page: {type: 'number', value: 0},
    sort: {Type: SortMap, Value: SortMap}
});
/**
 * @module data-admin
 */

/**
 * @constructor data-admin.ViewModel ViewModel
 * @parent data-admin
 * @group data-admin.ViewModel.props Properties
 * @group data-admin.ViewModel.topics Topics
 *
 * @description A `<data-admin />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('DataAdmin', {
  /**
   * @prototype
   */
    /**
     * The view object that controls the entire setup of the data-admin.
     * Properties on the view control how each field is formatted, default values,
     * interactions, etc.
     * @property {crud.types.viewMap} data-admin.ViewModel.props.view
     * @parent data-admin.ViewModel.props
     */
    view: {
        Type: ViewMap
    },
    /**
     * The current page to display in this view. Options include:
     * * `list`: The list table page that displays all records
     * * `details`: The individual view page that shows one detailed record
     * * `edit`: The editing view that allows editing of an individual record using a form
     * @property {String} data-admin.ViewModel.props.page
     * @parent data-admin.ViewModel.props
     */
    page: {
        value: 'list',
        type: 'string'
    },
    /**
     * A virtual property that calculates the number of total pages to show
     * on the list page. This controls the paginator widget. It uses the property
     * `view.connectionProperties.total`  and `queryPerPage` to perform this calculation.
     * @property {String} data-admin.ViewModel.props.totalPages
     * @parent data-admin.ViewModel.props
     */
    totalPages: {
        get () {
            const total = this.view.connection.metadata.total;
            if (!total) {
                return 0;
            }

        //round up to the nearest integer
            return Math.ceil(total /
          this.parameters.perPage);
        }
    },
    /**
     * The array of per page counts to display in the per page switcher. This
     * list is automatically filtered to include options provided where one
     * step below is less than the total count. Example, if there are
     * 30 total items, the default list returned will be 10, 20, and 50.
     * If no options are returned the per page switcher is hidden.
     * @property {Array<Number>} data-admin.ViewModel.props.perPageOptions
     * @parent data-admin.ViewModel.props
     */
    perPageOptions: {
        Value () {
            return [10, 20, 50, 100];
        },
        get (counts) {
            return counts.filter((c, index) => {
                return counts[index ? index - 1 : index] < this.view.connection.metadata.total;
            });
        }
    },
    /**
     * A helper to show or hide the paginate-widget. If totalPages is less than
     * 2, the paginate widget will not be shown.
     * @property {Boolean} data-admin.ViewModel.props.showPaginate
     * @parent data-admin.ViewModel.props
     */
    showPaginate: {
        type: 'boolean',
        get () {
            return this.totalPages > 1;
        }
    },
    /**
     * the internal parameters object. This is prepopulated when view is set.
     * @type {Object}
     */
    parameters: {
        Value: ParameterMap,
        Type: ParameterMap,
        set (params) {
            if (this.view.parameters) {
                assign(params, this.view.parameters);
            }
        }
    },
    /**
     * A promise that resolves to the objects retrieved from a can-connect.getListData call
     * @property {can.Deferred} data-admin.ViewModel.props.objects
     * @parent data-admin.ViewModel.props
     */
    objectsPromise: {
        get () {
            const params = this.parameters ? this.parameters.serialize() : {};
            const promise = this.view.connection.getList(params);

            return promise;
        }
    },
    objects: {
        Value: DefineList,
        Type: DefineList,
        get (val, setAttr) {
            const promise = this.objectsPromise;

        // handle promise.catch for local-storage deferreds...
            promise.catch((err) => {
                console.warn('unable to complete objects request', err);
            });

          // update the list data
            promise.then((data) => {
                setAttr(data);
            });
        }
    },
    /**
     * A promise that resolves to the object retreived from a `can-connect.get` call
     * @property {can.Map} data-admin.ViewModel.props.focusObject
     * @parent data-admin.ViewModel.props
     */
    focusObjectPromise: {
        get () {
            if (this.viewId) {
                const params = {};
                params[this.view.connection.idProp] = this.viewId;
                const promise = this.view.connection.get(params);

                promise.catch((err) => {
                    console.error('unable to complete focusObject request', err);
                });

                return promise;
            }
            return null;
        }
    },
    focusObject: {
        // async getter
        // eslint-disable-next-line consistent-return
        get (val, setAttr) {
            if (!this.focusObjectPromise) {
                return null;
            }
            this.focusObjectPromise.then((data) => {
                setAttr(data);
            });
        }
    },
    /**
     * Buttons to use for the list table actions. If `view.disableEdit` is falsey
     * the buttons will include an edit and delete button. Otherwise, it will be
     * a simple view details button.
     * @property {Array<crud.types.TableButtonObject>} data-admin.ViewModel.props.buttons
     * @parent data-admin.ViewModel.props
     */
    buttons: {
        type: '*',
        get () {
            return this.view.disableEdit ? DEFAULT_BUTTONS : EDIT_BUTTONS;
        }
    },
    /**
     * The page number, this is calculated by incrementing the queryPage by one.
     * @property {Number}  data-admin.ViewModel.props.pageNumber
     * @parent data-admin.ViewModel.props
     */
    pageNumber: {
        get () {
            return this.parameters.page + 1;
        }
    },
    /**
     * The current id number of the object that is being viewed in the property
     * table or edited in the form widget.
     * @property {Number}  data-admin.ViewModel.props.buttons
     * @parent data-admin.ViewModel.props
     */
    viewId: {
        type: 'number',
        value: 0
    },
    /**
     * Current loading progress. NOT IMPLEMENTED
     * TODO: implement loading progress on lengthy processes like multi delete
     * @property {Number}  data-admin.ViewModel.props.progress
     * @parent data-admin.ViewModel.props
     */
    progress: {
        type: 'number',
        value: 100
    },
    /**
     * Whether or not the filter popup is visible
     * @property {Boolean} data-admin.ViewModel.props.buttons
     * @parent data-admin.ViewModel.props
     */
    filterVisible: {type: 'boolean', value: false},
    selectMenu: {type: 'boolean', value: false},
    /**
     * The internal field array that define the display of data and field types
     * for editing and filtering
     * @property {Array<Field>} data-admin.ViewModel.props._fields
     * @parent data-admin.ViewModel.props
     */
    _fields: {
        get () {

        //try a fields propety first
            if (this.view.fields) {
                return parseFieldArray(this.view.fields);
            }

        //if that doesn't exist, use the objectTemplate or Map to create fields
            const Template = this.view.objectTemplate || this.view.connection.Map;
            return mapToFields(Template);
        }
    },
    /**
     * An array of currently selected objects in the list-table
     * @property {Array<can.Map>} data-admin.ViewModel.props.selectedObjects
     * @parent data-admin.ViewModel.props
     */
    selectedObjects: DefineList,
  /**
   * @function init
   * Initializes filters and other parameters
   */
    init () {
    //set up related filters which are typically numbers
        if (this.relatedField) {
            let val = parseFloat(this.relatedValue);
            if (!val) {
        //if we can't force numeric type, just use default value
                val = this.relatedValue;
            }
            this.parameters.filters.push({
                name: this.relatedField,
                operator: 'equals',
                value: this.relatedValue
            });
        }
    },
  /**
   * @function setPage
   * Changes the page and resets the viewId to 0
   * @signature
   * @param {String} page The name of the page to switch to
   */
    setPage (page) {
        this.set({
            viewId: null,
            page: page
        });
        // this.viewId = null;
        // setTimeout(() => {
        //     this.page = page;
        // }, 100);
    },
  /**
   * @function editObject
   * Sets the current viewId to the object's id and sets the page to edit
   * to start editing the object provided.
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to start editing
   */
    editObject () {
        let obj;
    //accept 4 params from the template or just one
        if (arguments.length === 4) {
            obj = arguments[3];
        } else {
            obj = arguments[0];
        }
        this.viewId = this.view.connection.id(obj);
        setTimeout(() => {
            this.page = 'edit';
        }, 100);
    },
  /**
   * @function viewObject
   * Sets the current viewId to the object's id and sets the page to details
   * to display a detailed view of the object provided.
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to view
   */
    viewObject () {
        let obj;
        //accept 4 params from the template or just one
        if (arguments.length === 4) {
            obj = arguments[3];
        } else {
            obj = arguments[0];
        }
        this.viewId = this.view.connection.id(obj);
        setTimeout(() => {
            this.page = 'details';
        }, 100);
    },
  /**
   * @function saveObject
   * Saves the provided object and sets the current viewId to the object's
   * id once it is returned. We then switch the page to the detail view to
   * display the created or updated object.
   *
   * @signature `saveObject(obj)`
   * @param  {can.Map} obj   The object to save
   *
   * @signature `saveObject(scope, dom, event, obj)`
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to save
   */
    saveObject () {
        let obj;
    //accept 4 params from the template or just one
        if (arguments.length === 4) {
            obj = arguments[3];
        } else {
            obj = arguments[0];
        }
        const isNew = obj.isNew();

    // trigger events beforeCreate/beforeSave depending on if we're adding or
    // updating an object
        if (isNew) {
            val = this.onEvent(obj, 'beforeCreate');
        } else {
            val = this.onEvent(obj, 'beforeSave');
        }

        // halt save or create if the value returned is falsey
        if (!val) {
            return null;
        }

        //save the object
        var deferred = this.view.connection.save(obj);
        deferred.then((result) => {

            // if event handlers
            if (isNew) {
                this.onEvent(obj, 'afterCreate');
            } else {
                this.onEvent(obj, 'afterSave');
            }

      //update the view id
      //set page to the details view by default
            this.viewId = result.id;
            setTimeout(() => {
                this.page = 'details';
            }, 100);


        }).catch((e) => {
            this.onEvent({
                obj: obj,
                error: e
            }, 'errorSave');
            console.error(e);
        });
        return deferred;
    },
  /**
   * @function getNewObject
   * Creates and returns a new object from the view's ObjectTemplate
   * @signature
   * @return {DefineMap} A new object created from the `view.ObjectTemplate`
   */
    getNewObject () {
    //create a new empty object with the defaults provided
    //from the ObjectTemplate property which is a map
        const props = {};
        if (this.relatedField) {
            props[this.relatedField] = this.relatedValue;
        }
        return new (this.view.ObjectTemplate)(props);
    },
  /**
   * @function deleteObject
   * Displays a confirm dialog box and if confirmed, deletes the object provided.
   *
   * @signature `deleteObject(obj, skipConfirm)`
   * @param  {can.Map} obj   The object to delete
   * @param {Boolean} skipConfirm If true, the method will not display a confirm dialog
   *
   * @signature `deleteObject( scope, dom, event, obj, skipConfirm )`
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to delete
   * @param {Boolean} skipConfirm If true, the method will not display a confirm dialog
   * and will immediately attempt to remove the object
   */
    deleteObject () {
        let obj, skipConfirm;
    //arguments can be ( scope, dom, event, obj, skipConfirm )
    //OR (obj, skipConfirm)
        if (arguments.length > 2) {
            obj = arguments[3];
            skipConfirm = arguments[4];
        } else {
            obj = arguments[0];
            skipConfirm = arguments[1];
        }
        if (obj && (skipConfirm || confirm('Are you sure you want to delete this record?'))) {

      // beforeDelete handler
      // if return value is falsey, stop execution and don't delete
            if (!this.onEvent(obj, 'beforeDelete')) {
                return;
            }

      //destroy the object using the connection
            const deferred = this.view.connection.destroy(obj);
            deferred.then((result) => {

                //afterDelete handler
                this.onEvent(obj, 'afterDelete');
            });

            deferred.catch((result) => {
                //add a message
                this.onEvent(result, 'failDelete');
                console.error(result);
            });
            return deferred;
        }
    },
  /**
   * @function deleteMultiple
   * Iterates through the objects in the `selectedObjects` array
   * and deletes each one individually.
   * //TODO implement batch deleting to avoid many ajax calls
   * @signature
   * @param {Boolean} skipConfirm If true, the method will not display a confirm dialog
   * and will immediately attempt to remove the selected objects
   */
    deleteMultiple (skipConfirm) {
        const selected = this.selectedObjects;
        const defs = [];
        if (skipConfirm || confirm(`Are you sure you want to delete the ${selected.length} selected records?`)) {
            selected.forEach((obj) => {
                defs.push(this.deleteObject(null, null, null, obj, true));
            });
            selected.replace([]);
        }
        return defs;
    },
  /**
   * @function clearSelection
   * empties the currently selected objects array
   */
    clearSelection () {
        this.selectedObjects.replace([]);
    },
  /**
   * passes an array of objects to the on click handler
   * @param  {object} obj     A single object
   * @param  {Function} onClick The function to pass array of objects to
   */
    manageObject (obj, button) {
        button.onClick([obj]);
    },
  /**
   * @function toggleFilter
   * Toggles the display of the filter dialog
   * @signature
   * @param  {Boolean} val (Optional) whether or not to display the dialog
   */
    toggle (val, visible) {
        if (typeof visible !== 'undefined') {
            this[val] = Boolean(visible);
        } else {
            this[val] = !this[val];
        }
    },
  /**
   * @function getRelatedValue
   * Retrieves a value from an object based on the key provided
   * @signature
   * @param  {String} foreignKey  The name of the field to retrieve from the object
   * @param  {can.Map} focusObject The object to retrieve the property from
   * @return {*} The object's property
   */
    getRelatedValue (foreignKey, focusObject) {
        return focusObject[foreignKey];
    },
  /**
   * @function onEvent
   * A helper function to trigger beforeSave, afterSave, etc events.
   * @signature
   * @param  {can.Map} obj       The object to dispatch with the event
   * @param  {String} eventName The name of the event to dispatch
   */
    onEvent (obj, eventName) {

    //get the view method
        const prop = this.view[eventName];

    //if it is a function, call it passing the object
        let returnVal = true;
        if (typeof prop === 'function') {
            returnVal = prop(obj);

      // Only return falsey value if a value is returned.
      // Otherwise the execution of the event will be halted unintentionally
            if (typeof returnVal === 'undefined') {
                returnVal = true;
            }
        }

    //dispatch an event
        this.dispatch(eventName, [obj]);

        return returnVal;
    }
});

Component.extend({
    tag: 'data-admin',
    ViewModel: ViewModel,
    view: template,
    events: {
        '{ViewModel.parameters} filters' () {
            this.viewModel.parameters.page = 0;
        },
        '{ViewModel.parameters} perPage' () {
            this.viewModel.parameters.page = 0;
        }
    }
});