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
/*!
  hey, [be]Lazy.js - v1.8.2 - 2016.10.25
  A fast, small and dependency free lazy load script (https://github.com/dinbror/blazy)
  (c) Bjoern Klinggaard - @bklinggaard - http://dinbror.dk/blazy
*/
(function (q, m) { "function" === typeof define && define.amd ? define(m) : "object" === typeof exports ? module.exports = m() : q.Blazy = m() })(this, function () { function q(b) { var c = b._util; c.elements = E(b.options); c.count = c.elements.length; c.destroyed && (c.destroyed = !1, b.options.container && l(b.options.container, function (a) { n(a, "scroll", c.validateT) }), n(window, "resize", c.saveViewportOffsetT), n(window, "resize", c.validateT), n(window, "scroll", c.validateT)); m(b) } function m(b) { for (var c = b._util, a = 0; a < c.count; a++) { var d = c.elements[a], e; a: { var g = d; e = b.options; var p = g.getBoundingClientRect(); if (e.container && y && (g = g.closest(e.containerClass))) { g = g.getBoundingClientRect(); e = r(g, f) ? r(p, { top: g.top - e.offset, right: g.right + e.offset, bottom: g.bottom + e.offset, left: g.left - e.offset }) : !1; break a } e = r(p, f) } if (e || t(d, b.options.successClass)) b.load(d), c.elements.splice(a, 1), c.count-- , a-- } 0 === c.count && b.destroy() } function r(b, c) { return b.right >= c.left && b.bottom >= c.top && b.left <= c.right && b.top <= c.bottom } function z(b, c, a) { if (!t(b, a.successClass) && (c || a.loadInvisible || 0 < b.offsetWidth && 0 < b.offsetHeight)) if (c = b.getAttribute(u) || b.getAttribute(a.src)) { c = c.split(a.separator); var d = c[A && 1 < c.length ? 1 : 0], e = b.getAttribute(a.srcset), g = "img" === b.nodeName.toLowerCase(), p = (c = b.parentNode) && "picture" === c.nodeName.toLowerCase(); if (g || void 0 === b.src) { var h = new Image, w = function () { a.error && a.error(b, "invalid"); v(b, a.errorClass); k(h, "error", w); k(h, "load", f) }, f = function () { g ? p || B(b, d, e) : b.style.backgroundImage = 'url("' + d + '")'; x(b, a); k(h, "load", f); k(h, "error", w) }; p && (h = b, l(c.getElementsByTagName("source"), function (b) { var c = a.srcset, e = b.getAttribute(c); e && (b.setAttribute("srcset", e), b.removeAttribute(c)) })); n(h, "error", w); n(h, "load", f); B(h, d, e) } else b.src = d, x(b, a) } else "video" === b.nodeName.toLowerCase() ? (l(b.getElementsByTagName("source"), function (b) { var c = a.src, e = b.getAttribute(c); e && (b.setAttribute("src", e), b.removeAttribute(c)) }), b.load(), x(b, a)) : (a.error && a.error(b, "missing"), v(b, a.errorClass)) } function x(b, c) { v(b, c.successClass); c.success && c.success(b); b.removeAttribute(c.src); b.removeAttribute(c.srcset); l(c.breakpoints, function (a) { b.removeAttribute(a.src) }) } function B(b, c, a) { a && b.setAttribute("srcset", a); b.src = c } function t(b, c) { return -1 !== (" " + b.className + " ").indexOf(" " + c + " ") } function v(b, c) { t(b, c) || (b.className += " " + c) } function E(b) { var c = []; b = b.root.querySelectorAll(b.selector); for (var a = b.length; a--; c.unshift(b[a])); return c } function C(b) { f.bottom = (window.innerHeight || document.documentElement.clientHeight) + b; f.right = (window.innerWidth || document.documentElement.clientWidth) + b } function n(b, c, a) { b.attachEvent ? b.attachEvent && b.attachEvent("on" + c, a) : b.addEventListener(c, a, { capture: !1, passive: !0 }) } function k(b, c, a) { b.detachEvent ? b.detachEvent && b.detachEvent("on" + c, a) : b.removeEventListener(c, a, { capture: !1, passive: !0 }) } function l(b, c) { if (b && c) for (var a = b.length, d = 0; d < a && !1 !== c(b[d], d); d++); } function D(b, c, a) { var d = 0; return function () { var e = +new Date; e - d < c || (d = e, b.apply(a, arguments)) } } var u, f, A, y; return function (b) { if (!document.querySelectorAll) { var c = document.createStyleSheet(); document.querySelectorAll = function (a, b, d, h, f) { f = document.all; b = []; a = a.replace(/\[for\b/gi, "[htmlFor").split(","); for (d = a.length; d--;) { c.addRule(a[d], "k:v"); for (h = f.length; h--;) f[h].currentStyle.k && b.push(f[h]); c.removeRule(0) } return b } } var a = this, d = a._util = {}; d.elements = []; d.destroyed = !0; a.options = b || {}; a.options.error = a.options.error || !1; a.options.offset = a.options.offset || 100; a.options.root = a.options.root || document; a.options.success = a.options.success || !1; a.options.selector = a.options.selector || ".b-lazy"; a.options.separator = a.options.separator || "|"; a.options.containerClass = a.options.container; a.options.container = a.options.containerClass ? document.querySelectorAll(a.options.containerClass) : !1; a.options.errorClass = a.options.errorClass || "b-error"; a.options.breakpoints = a.options.breakpoints || !1; a.options.loadInvisible = a.options.loadInvisible || !1; a.options.successClass = a.options.successClass || "b-loaded"; a.options.validateDelay = a.options.validateDelay || 25; a.options.saveViewportOffsetDelay = a.options.saveViewportOffsetDelay || 50; a.options.srcset = a.options.srcset || "data-srcset"; a.options.src = u = a.options.src || "data-src"; y = Element.prototype.closest; A = 1 < window.devicePixelRatio; f = {}; f.top = 0 - a.options.offset; f.left = 0 - a.options.offset; a.revalidate = function () { q(a) }; a.load = function (a, b) { var c = this.options; void 0 === a.length ? z(a, b, c) : l(a, function (a) { z(a, b, c) }) }; a.destroy = function () { var a = this._util; this.options.container && l(this.options.container, function (b) { k(b, "scroll", a.validateT) }); k(window, "scroll", a.validateT); k(window, "resize", a.validateT); k(window, "resize", a.saveViewportOffsetT); a.count = 0; a.elements.length = 0; a.destroyed = !0 }; d.validateT = D(function () { m(a) }, a.options.validateDelay, a); d.saveViewportOffsetT = D(function () { C(a.options.offset) }, a.options.saveViewportOffsetDelay, a); C(a.options.offset); l(a.options.breakpoints, function (a) { if (a.width >= window.screen.width) return u = a.src, !1 }); setTimeout(function () { q(a) }) } });


//Our initializer
var bLazy = new Blazy({
    breakpoints: [{
        width: 640 // Max-width
        , loadInvisible: true
        , src: 'data-src-small'
    },
    {
        width: 990 // Max-width
        , loadInvisible: true
        , src: 'data-src-medium'
    },
    {
        width: 1920 // Max-width
        , loadInvisible: true
        , src: 'data-src-large'
    }],
    success: function (e) {
        var thisImage = e;
        var mainFilter = thisImage.closest(".js-main-image-filter");

        if (mainFilter != null && thisImage.clientWidth > 1) {
            mainFilter.style.width = thisImage.clientWidth + "px";
        }

        if (thisImage.hasAttribute("data-secondary-image-src")) {
            if (thisImage.getAttribute("data-secondary-image-src") != "") {
                thisImage.onmouseover = function () {
                    thisImage.setAttribute("data-src", thisImage.src);
                    thisImage.src = thisImage.getAttribute("data-secondary-image-src");
                };
                thisImage.onmouseout = function () {
                    thisImage.src = thisImage.getAttribute("data-src");
                };
            }
        }
    }
});
var Cart = function () { }
                                                         

Cart.prototype.UpdateCart = async function (e) {
    var clickedButton = e.currentTarget;
    var clickedButtonWidth = clickedButton.offsetWidth + "px";

    clickedButton.setAttribute("data-content", clickedButton.innerHTML);
    clickedButton.style.minWidth = clickedButtonWidth;
    clickedButton.classList.add("disabled");
    clickedButton.disabled = true;
    clickedButton.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i>";

    var form = clickedButton.closest("form");
    let formData = new FormData(form);
    var fetchOptions = {
        method: 'POST',
        body: formData
    };
    let response = await fetch(form.action, fetchOptions);

    if (response.ok) {
        Cart.Success(response, clickedButton);
    } else {
        Cart.Error(response, clickedButton);
    }
}

Cart.prototype.Success = async function (response, clickedButton) {
    clickedButton.classList.remove("disabled");
    clickedButton.disabled = false;
    clickedButton.innerHTML = clickedButton.getAttribute("data-content");
    clickedButton.setAttribute("data-content", "");

    let html = await response.text().then(function (text) {
        return text;
    });

    var totalQuantity = html != undefined ? html : 0;
    document.querySelectorAll(".js-cart-qty").forEach(function (el) {
        el.innerHTML = totalQuantity;
    })
}

Cart.prototype.Error = async function (response, clickedButton) {
    clickedButton.classList.remove("disabled");
    clickedButton.disabled = false;
    clickedButton.innerHTML = "<i class=\"fas fa-exclamation-triangle\"></i>";
}

var Cart = new Cart();

var Matrix = function () {
    this.element = document.querySelector('.js-matrix');
    this.triggers = document.querySelectorAll('.js-matrix-trigger');

    this.Toggle();
}

Matrix.prototype.UpdateQuantities = function(field) {
    let matrixElement = field.closest('.js-matrix');
    var qtyFields = matrixElement.querySelectorAll("[data-row-id]");
    var allRowsQuantity = 0;
    var totalPrice = 0;

    //Reset row totals
    for (var qtyField of qtyFields) {
        let currentRow = qtyField.getAttribute("data-row-id");

        if (currentRow) {
            let rowTotal = matrixElement.querySelector("[data-row-total='" + currentRow + "']");
            rowTotal.innerText = 0;
        }
    };

    //Update with new quantities
    for (var qtyField of qtyFields) {
        let currentRow = qtyField.getAttribute("data-row-id");

        if (currentRow) {
            let rowTotal = matrixElement.querySelector("[data-row-total='" + currentRow + "']");

            if (qtyField.value != 0) {
                rowTotal.innerText = (parseFloat(rowTotal.innerText) + parseFloat(qtyField.value));
                allRowsQuantity += parseFloat(qtyField.value);
            }

            totalPrice += (qtyField.getAttribute("data-price") * parseFloat(qtyField.value));
        }
    };

    //Reset column totals
    for (var qtyField of qtyFields) {
        let currentColumn = qtyField.getAttribute("data-column-id");

        if (currentColumn) {
            let rowTotal = matrixElement.querySelector("[data-column-total='" + currentColumn + "']");
            rowTotal.innerText = 0;
        }
    };

    //Update column new quantities
    for (var qtyField of qtyFields) {
        let currentColumn = qtyField.getAttribute("data-column-id");

        if (currentColumn) {
            let rowTotal = matrixElement.querySelector("[data-column-total='" + currentColumn + "']");

            if (qtyField.value != 0) {
                rowTotal.innerText = (parseFloat(rowTotal.innerText) + parseFloat(qtyField.value));
            }
        }
    };

    if (matrixElement.querySelector(".js-total-quantity")) {
        matrixElement.querySelector(".js-total-quantity").innerText = allRowsQuantity;
    }

    var totalPriceElement = matrixElement.querySelector(".js-total-price");

    if (totalPriceElement) {
        totalPrice = totalPrice.toLocaleString(totalPriceElement.getAttribute("data-country-code"), { style: 'currency', currency: totalPriceElement.getAttribute("data-currency-code") });

        matrixElement.querySelector(".js-total-price").innerText = totalPrice;
    }
}

//As there is already a form form need for the whole cart submit, we must collect the data for submit in another way than using a form
Matrix.prototype.UpdateCart = function(submitBtn, pageId) {
    const queryString = "/Default.aspx?ID=" + pageId + "&cartcmd=setmulti&redirect=false";
    const body = {};
    let matrixElement = submitBtn.closest('.js-matrix');
    var matrixFields = matrixElement.querySelectorAll("input");

    for (var field of matrixFields) {
        if (field.name != "" && field.value) {
            body[field.name] = field.value;
        }
    };

    Matrix.AddPreloader();

    Request.Fetch().post(
        queryString,
        body,
        function () {
            location.reload();
        },
        null,
        false
    );
}

//As there is already a form form need for the whole cart submit, we must collect the data for submit in another way than using a form
Matrix.prototype.AddToCart = function (submitBtn, pageId) {
    const queryString = "/Default.aspx?ID=" + pageId + "&cartcmd=addmulti&redirect=false";
    const body = {};
    let matrixElement = submitBtn.closest('.js-matrix');
    var matrixFields = matrixElement.querySelectorAll("input");

    for (var field of matrixFields) {
        if (field.name != "" && field.value) {
            body[field.name] = field.value;
        }
    };

    Matrix.AddPreloader();

    Request.Fetch().post(
        queryString,
        body,
        function () {
            location.reload();
        },
        null,
        false
    );
}

Matrix.prototype.AddPreloader = function () {
    var overlayElement = document.createElement('div');
    overlayElement.className = "preloader-overlay";
    overlayElement.setAttribute('id', "overlay");
    var overlayElementIcon = document.createElement('div');
    overlayElementIcon.className = "preloader-overlay__icon dw-mod";
    overlayElementIcon.style.top = window.pageYOffset + "px";
    overlayElement.appendChild(overlayElementIcon);

    var contentElement = document.getElementById("content");
    if (contentElement) {
        contentElement.parentNode.insertBefore(overlayElement, contentElement);
    }
}



/**
 * Toggles visibility of matrix options
 */

Matrix.prototype.Toggle = function() {

    for ( let i = 0; i < this.triggers.length; i++ ) {
        const trigger = this.triggers[i];

        // Bail early if trigger not found
        if ( trigger == null || typeof trigger == 'undefined' ) return;

        trigger.addEventListener('click', function(e) {
            e.preventDefault();

            const id = this.dataset.id;
            const element = document.getElementById(id);

            // Bail early if element not found
            if ( element == null || typeof element == 'undefined' ) return;

            element.classList.toggle('u-hidden');
            this.classList.toggle('is-open');

            if (bLazy != null) {
                setTimeout(function () {
                    bLazy.revalidate();
                }, 100);
            }
        });

    }

}

Matrix.prototype.ShowOptionImageModal = function (thisButton) {
    var modalTrigger = document.querySelector('#OptionColorImageModalTrigger');

    if (modalTrigger) {
        modalTrigger.checked = true;
        document.querySelector('#OptionColorImageElement').src = thisButton.getAttribute("data-img-src");
    }  
}

var Matrix = new Matrix();
var PageContent = function () { }
                                                         

PageContent.prototype.Update = function (e) {
    e.preventDefault();

    var clickedButton = e.currentTarget;
    var form = clickedButton.closest("form");
    var responseTargetElement = "#" + form.getAttribute("data-response-target-element");

    document.querySelectorAll("[name=id]").forEach(function (el) {
        el.classList.remove("active");
        el.parentNode.classList.remove("active");
    })
    clickedButton.classList.add("active");
    clickedButton.parentNode.classList.add("active");

    //Set active at top level
    if (!clickedButton.classList.contains("nav-link")) {
        var navItem = clickedButton.closest(".nav-item");

        if (navItem) {
            navItem.classList.add("active");
            navItem.querySelector(".nav-link").classList.add("active");
        }
    }

    history.pushState(null, null, clickedButton.href);
    PageContent.navigateToPage(clickedButton.href, responseTargetElement);
}

PageContent.prototype.navigateToPage = async function (href, target) {
    var fetchHref = href;
    if (href.indexOf("?") > 0) {
        fetchHref += "&removeMasterLayout=true";
    } else {
        fetchHref += "?removeMasterLayout=true";
    }

    let response = await fetch(fetchHref);

    var addPreloaderTimer = setTimeout(function () {
        var overlayElement = document.createElement('div');
        overlayElement.className = "preloader-overlay";
        overlayElement.setAttribute('id', "overlay");
        var overlayElementIcon = document.createElement('div');
        overlayElementIcon.className = "preloader-overlay-icon";
        overlayElementIcon.style.top = window.pageYOffset + "px";
        overlayElement.appendChild(overlayElementIcon);

        if (form) {
            document.querySelector("#content").parentNode.insertBefore(overlayElement, document.querySelector("#content"));
        }
    }, 200); //Small delay to secure that the preloader is not loaded all the time

    if (!response.ok) {
        clearTimeout(addPreloaderTimer);

        if (document.querySelector("#overlay")) {
            document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
        }

        throw new Error('HTTP error! status: ${response.status}');
    } else {
        let html = await response.text().then(function (text) {
            return text;
        });

        PageContent.Success(html, target, addPreloaderTimer);
    }
    window.scrollTo(0, 0);
}

PageContent.prototype.Success = function (html, target, addPreloaderTimer) {
    clearTimeout(addPreloaderTimer);

    if (document.querySelector("#overlay")) {
        document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
    }

    if (document.querySelector(target)) {
        document.querySelector(target).innerHTML = html;
    }

    if (bLazy != null) {
        setTimeout(function () {
            bLazy.revalidate();
        }, 100);
    }
}

var PageContent = new PageContent();

var ProductList = function () { }
                                                         

ProductList.prototype.Update = async function (e) {
    var clickedButton = e.currentTarget;
    var form = clickedButton.closest("form");
    var responseTargetElement = "#" + form.getAttribute("data-response-target-element");

    var addPreloaderTimer = setTimeout(function () {
        var overlayElement = document.createElement('div');
        overlayElement.className = "preloader-overlay";
        overlayElement.setAttribute('id', "overlay");
        var overlayElementIcon = document.createElement('div');
        overlayElementIcon.className = "preloader-overlay-icon";
        overlayElementIcon.style.top = window.pageYOffset + "px";
        overlayElement.appendChild(overlayElementIcon);

        if (form) {
            form.parentNode.insertBefore(overlayElement, form);
        }
    }, 200); //Small delay to secure that the preloader is not loaded all the time

    let formData = new FormData(form);
    var fetchOptions = {
        method: 'POST',
        body: formData
    };
    let response = await fetch(form.action, fetchOptions);

    if (response.ok) {
        //Update URL
        let url = window.location.origin + window.location.pathname;
        const newParams = new URLSearchParams(formData);

        url += "?" + newParams.toString();
        window.history.pushState({}, '', url);

        //Success
        ProductList.Success(response, responseTargetElement, addPreloaderTimer);
    } else {
        ProductList.Error(response, responseTargetElement, addPreloaderTimer);
    }
}

ProductList.prototype.Success = async function (response, responseTargetElement, addPreloaderTimer) {
    clearTimeout(addPreloaderTimer);

    //Remove preloader
    if (document.querySelector("#overlay")) {
        document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
    }

    //Replace content
    let html = await response.text().then(function (text) {
        return text;
    });

    document.querySelector(responseTargetElement).innerHTML = html;

    //Lazy load images
    if (bLazy != null) {
        setTimeout(function () {
            bLazy.revalidate();
        }, 100);
    }
}

ProductList.prototype.Error = function (e, responseTargetElement, addPreloaderTimer) {
    clearTimeout(addPreloaderTimer); 

    if (document.querySelector("#overlay")) {
        document.querySelector("#overlay").parentNode.removeChild(document.querySelector("#overlay"));
    }
}

ProductList.prototype.ResetFacets = async function (e) {
    var clickedButton = e.currentTarget;
    var form = clickedButton.closest("form");

    form.querySelectorAll("input[type='checkbox']").forEach(function (el) {
        el.checked = false;
    });

    ProductList.Update(e);
}

var ProductList = new ProductList();

//This code based on instructions from https://developers.google.com/youtube/iframe_api_reference

document.addEventListener("DOMContentLoaded", function () {
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.

});

function onYouTubeIframeAPIReady() {
    document.querySelectorAll('.js-youtube-video').forEach(function (el) {
        var videoId = el.getAttribute('data-video');
        var elId = el.getAttribute('id');
        var autoPlay = el.getAttribute('data-auto-play') != null ? el.getAttribute('data-auto-play') : 1;
        var controls = el.getAttribute('data-enable-controls') != null ? el.getAttribute('data-enable-controls') : 0;
        var mute = autoPlay = 1 ? 1 : 0;


        player = new YT.Player(elId, {
            videoId: videoId,                                                                                        
            playerVars: {
                autoplay: 0,
                controls: controls,
                loop: 1,
                playlist: videoId,
                playsinline: 1,
                showinfo: 0,
                disablekb: 1,
                modestbranding: 1,
                mute: mute,
                rel: 0
            },
            events: {
                'onReady': onPlayerReady,
                'onError': onError
            }
        });
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //event.target.playVideo();
}

function onError(event) {
    event.target.a.style.display = "none";
}
var Wireframe = function () { }

var wireframeConfig = {
    cssFilesToRemove: ["rapidoCss", "igniteCss"],
    hasTemplateEngine: true,
    paragraphContainerClass: "paragraph-container",
    backgroundImageContainers: ["paragraph-container", "multiple-paragraphs-container", "layered-image", "center-container--with-background-image", "background-image", "carousel__slide", "content-row__item"],
    mediaContainers: ["google-map", "map-container", "video-wrapper", "video-background__container", "dynamicweb-map__wrap"],
    hiddenClass: "u-hidden",
    visuallyHiddenClass: "u-visually-hidden",
    wireImageClass: "wire-image",
    wireBackgroundImageClass: "wire-image-lines",
    wireGrayscaleClass: "wire-grayscale",
    lightBoxImageClass: "lightbox__image",
    elementsWithColorClasses: ["u-color-warning"],
    replacementColorClass: "u-color-light-gray",
    elementsWithBackgroundColorClasses: ["u-color-warning--bg", "receipt__header"],
    replacementBackgroundColorClass: "u-color-light-gray--bg"
};

Wireframe.prototype.GetConfiguration = function () {
    if (typeof WireframeConfig == 'object') {
        wireframeConfig = WireframeConfig.Configuration();
    }
}

var _wireframeMode = false;

Wireframe.prototype.Init = function (wireframeMode) {
    _wireframeMode = wireframeMode;

    if (!wireframeMode) {
        return;
    }

    document.body.classList.add(wireframeConfig.hiddenClass);

    //Render as Wireframe
    document.addEventListener("DOMContentLoaded", function (event) {
        Wireframe.GetConfiguration();

        Wireframe.WireImages();

        for (var i = 0; i < wireframeConfig.cssFilesToRemove.length; i++) {
            document.getElementById(wireframeConfig.cssFilesToRemove[i]).setAttribute("href", "");
        }
        document.body.classList.remove(wireframeConfig.hiddenClass);
    });

    document.addEventListener('contentLoaded', function (event) {
        Wireframe.WireImages();
    });

    document.addEventListener('addToCart', function (event) {
        Wireframe.WireImages();
    });

    document.addEventListener('showLastAddedProduct', function (event) {
        Wireframe.WireImages();
    });

    if (wireframeConfig.hasTemplateEngine) {
        var ajaxContainer = document.getElementsByClassName("js-handlebars-root");
        for (var i = 0; i < ajaxContainer.length; i++) {
            ajaxContainer[i].addEventListener('contentLoaded', function (e) {
                Wireframe.WireImages();
            }, false);
        }

        document.addEventListener('updateTemplate', function (e) {
            Wireframe.WireImages();
        }, false);
    }

    var event = new CustomEvent('wireframeInit');
    document.dispatchEvent(event);

}

//Render all images as 'abstract' symbolized images
Wireframe.prototype.WireImages = function () {
    if (!_wireframeMode) {
        return;
    }

    var imgElements = document.getElementsByTagName("IMG");

    for (var i = 0; i < imgElements.length; i++) {
        var imageElement = imgElements[i];

        if (!imageElement.classList.contains(wireframeConfig.hiddenClass) && !imageElement.classList.contains(wireframeConfig.lightBoxImageClass)) {
            var imageWireframe = document.createElement("DIV");
            imageWireframe.classList.add(wireframeConfig.wireImageClass);
            imageElement.parentElement.insertBefore(imageWireframe, imageElement.parentNode.firstChild);
        }

        if (imageElement.classList.contains(wireframeConfig.lightBoxImageClass)) {
            imageElement.classList.add(wireframeConfig.visuallyHiddenClass);
        }

        imageElement.classList.add(wireframeConfig.hiddenClass);
        imageElement.classList.remove("b-lazy");
    }

    for (var i = 0; i < wireframeConfig.backgroundImageContainers.length; i++) {
        var imgBgElements = document.getElementsByClassName(wireframeConfig.backgroundImageContainers[i]);

        for (var elm = 0; elm < imgBgElements.length; elm++) {
            var imgBgElement = imgBgElements[elm];
            imgBgElement.setAttribute("style", "");

            if (imgBgElement.style.backgroundImage != "") {
                imgBgElement.classList.add(wireframeConfig.wireBackgroundImageClass);
            }
        }
    }

    var imgBgElements = document.getElementsByClassName(wireframeConfig.paragraphContainerClass);

    for (var i = 0; i < imgBgElements.length; i++) {
        var imgBgElement = imgBgElements[i];

        if (imgBgElement.getAttribute("style") != "") {
            imgBgElement.setAttribute("style", "");
            imgBgElement.classList.add(wireframeConfig.wireBackgroundImageClass);
        }
    }

    for (var i = 0; i < wireframeConfig.mediaContainers.length; i++) {
        var mediaElement = document.getElementsByClassName(wireframeConfig.mediaContainers[i]);

        for (var elm = 0; elm < mediaElement.length; elm++) {
            mediaElement[elm].classList.add(wireframeConfig.wireGrayscaleClass);
        }
    }

    for (var i = 0; i < wireframeConfig.elementsWithColorClasses.length; i++) {
        var colorElement = document.querySelectorAll("." + wireframeConfig.elementsWithColorClasses[i]);
        var colorClass = wireframeConfig.elementsWithColorClasses[i];

        for (var elm = 0; elm < colorElement.length; elm++) {
            var warningElement = colorElement[elm];

            warningElement.classList.remove(colorClass);
            warningElement.classList.add(wireframeConfig.replacementColorClass);
        }
    }

    for (var i = 0; i < wireframeConfig.elementsWithBackgroundColorClasses.length; i++) {
        var colorElement = document.querySelectorAll("." + wireframeConfig.elementsWithBackgroundColorClasses[i]);
        var colorClass = wireframeConfig.elementsWithBackgroundColorClasses[i];

        for (var elm = 0; elm < colorElement.length; elm++) {
            var warningElement = colorElement[elm];

            console.log(elm); //??

            warningElement.classList.remove(colorClass);
            warningElement.classList.add(wireframeConfig.replacementBackgroundColorClass);
        }
    }

    var responsiveImages = document.getElementsByClassName("responsive-image");

    for (var i = 0; i < responsiveImages.length; i++) {
        responsiveImages[i].classList.remove("responsive-image--1-1");
        responsiveImages[i].classList.remove("responsive-image--16-9");
        responsiveImages[i].classList.remove("responsive-image--4-3");
    }
}

var Wireframe = new Wireframe();