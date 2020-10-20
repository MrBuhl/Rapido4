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
