; (function (root, factory) {

    // Name
    const pluginName = 'rapidoAjax';

    // Universal module definition (amd, commonjs, browser)
    if (typeof define === 'function' && define.amd) {
        define([], factory(pluginName));
    } else {
        root[pluginName] = factory(pluginName);
    }

}(this, function (pluginName) {

    'use strict';

    // Set the plugin defaults
    const defaults = {
        selectors: {
            content: 'content',
        },
        states: {
            hidden: 'u-hidden',
        },
        loader: 'preloader-overlay-element'
    };

    /**
     * Constructor.
     * @param  {element}  element  The selector element(s).
     * @param  {object}   options  The plugin options.
     * @return {void}
     */
    function AjaxPlugin(element, options) {
        this.options = Object.assign({}, defaults, options);
        this.element = element;
        this.form = document.querySelector(element);

        // Set the plugin object
        this._name = pluginName;
        this._defaults = defaults;

        // Initialize the plugin
        this.init();
    }

    /**
     * Private method for replacing respective content with response data
     * @param {any} res
     * @param {any} id
     */
    function getElementFromHTML(res, id) {
        var parser = new DOMParser();
        var responseDoc = parser.parseFromString(res, 'text/html');

        if (responseDoc.querySelector('[data-template="' + id + '"]')) {
            return responseDoc.querySelector('[data-template="' + id + '"]').innerHTML;
        } else {
            return responseDoc.innerHTML;
        }
    }

    /**
     * Public variables and methods.
     * @type {object}
     */
    AjaxPlugin.prototype = {
        /**
         * Initialize ajax
         */
        init: function () {
            const self = this;

            // Bail if form not found
            if (this.form == null) return;

            if (this.form.dataset != null && this.form.dataset != 'undefined') {
                this.cart = this.form.dataset.request;
            } else {
                console.error('Form missing data-request="{ID}"');
            }

            // Global object to store all data
            this.formData = {};

            // Collect data on load
            document.addEventListener('rapidoAjaxComplete', function () {
                self.setFormData();
            });
        },

        /**
         * XHR Helper
         * Uses Request.js
         * @param {object} data     FormData to send
         * @param {string} target   Reference to specificy what to replace
         * @param {*} callback      Callback function
         * @param {*} loadend       XHR loadend callback
         */
        request: function (data, target = 'parcel', callback, loadend = false) {
            const self = this;

            let url = `/Default.aspx?ID=${self.cart}&target=${target}`;
            let request = new Request.newRequest(url, 'POST', data, callback, false, false);

            request.xhr.onloadend = function (e) {
                if (typeof loadend == 'function') {
                    loadend(this);
                }
            }
        },

        /**
         * Set current available formdata
         */
        setFormData: function () {
            const self = this;

            Array.from(self.form.elements).forEach(function (item) {
                if (item.type == 'submit') return;

                self.formData[item.name] = item.value;
            });

        },

        /**
         * Get current available formdata
         */
        getFormData: function () {
            return this.formData;
        },

        /**
         * AJAX handling
         */
        reactivity: function () {
            const self = this;
            let items = document.querySelectorAll('[id*="Ajax"]:not(' + this.element + ')');

            let ids = Array.from(items).map(function (item) {
                return item.id;
            });

            // Bail if form not found
            if (this.form == null) return;

            this.form.addEventListener('input', function (event) {
                let element = event.target;
                let parent = element.closest('[id*="Ajax"]');
                let regex = new RegExp('Ajax');
                let item = (!regex.test(element.id) ? parent : element);

                // Update formdata by changed element
                self.formData[element.name] = element.value;

                // Update all formdata
                var allInputs = element.closest('form').querySelectorAll('input');
                for (var i = 0; i < allInputs.length; i++) {
                    var input = allInputs[i];

                    if (input.type == "radio") {
                        if (input.checked == true) {
                            self.formData[input.name] = input.value;
                        }
                    } else if (input.type == "select") {
                        if (input.seleced == true) {
                            self.formData[input.name] = input.value;
                        }
                    } else {
                        self.formData[input.name] = input.value;
                    }
                }

                //Only allow DOM elements that contains id="Ajax..."
                if (item != null && ids.indexOf(item.id) != -1) {
                    self.revalidate(element);
                }
            });
        },

        /**
         * Render content on initial load
         */
        renderContent: function () {
            const self = this;
            let items = document.querySelectorAll('[id*="Ajax"]:not(' + this.element + ')');

            self.loadTargets(items, function () {
                if (bLazy != null) {
                    setTimeout(function () {
                        bLazy.revalidate();
                    }, 100);
                }

                var event = new CustomEvent('rapidoAjaxContentRendered');
                document.dispatchEvent(event);
            });
        },

        /**
         * Revalidate all reactive blocks
         * @param {*} element   Element in form that changed state
         */
        revalidate: function (element) {
            const self = this;

            // Update formdata
            this.formData[element.name] = element.value;

            let reactive = element.getAttribute('data-bind-reactive');

            // Bail if not found
            if (reactive == null) return;

            let reactiveItems = reactive.split(',');

            self.loadTargets(reactiveItems, function () {
                var event = new CustomEvent('rapidoAjaxComplete');
                document.dispatchEvent(event);
            });
        },

        /**
         * Load content based on items
         * @param {any} items
         * @param {function} callback
         */
        loadTargets: function (items, callback) {
            const self = this;

            // Bail if no form
            if (this.form == null) return;

            for (var i = 0; i < items.length; i++) {
                let elementWrapper = getElement(items[i]);

                if (elementWrapper != null) {
                    elementWrapper.classList.add(self.options.loader);

                    if (elementWrapper.offsetHeight < 30) {
                        elementWrapper.classList.add("preloader-overlay-element--clean");
                    }
                }
            }

            let targets = Array.from(items).map(function (item) {
                return getCleanName(item);
            });

            // Callback in XHR request
            let loadendCallback = function (xhr) {
                for (var i = 0; i < items.length; i++) {
                    const item = items[i];
                    let id = getCleanName(item);

                    let ajaxElement = getElementFromHTML(xhr.response, id);
                    let elementWrapper = getElement(item);

                    if (elementWrapper != null) {
                        elementWrapper.classList.remove(self.options.loader);
                        elementWrapper.classList.remove("preloader-overlay-element--clean");

                        if (ajaxElement != null) {
                            elementWrapper.innerHTML = ajaxElement;
                        }
                    }
                }

                // Run callback after XHR (onloadend)
                if (callback) {
                    callback();
                }
            }

            // Send XHR
            self.request(self.formData, targets, false, loadendCallback);

            // Scoped helper to get name
            function getCleanName(item) {
                let id = (item.tagName == null || item.tagName == 'undefined') ? item : item.id;
                return id.replace('Ajax', '').trim();
            };

            // Scoped helper to get DOM element
            function getElement(item) {
                return (item.tagName == null || item.tagName == 'undefined') ? document.getElementById(`Ajax${item.trim()}`) : item;
            }
        }
    };

    // Return the plugin
    return AjaxPlugin;
}));

document.addEventListener('DOMContentLoaded', function () {
    let Ajax = new rapidoAjax("#AjaxContainer");

    Ajax.renderContent();

    // Ensure nested reactive selectors is loaded, before using them
    document.addEventListener('rapidoAjaxContentRendered', function () {
        Ajax.reactivity();
    });
});