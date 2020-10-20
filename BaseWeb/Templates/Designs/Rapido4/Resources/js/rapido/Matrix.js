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