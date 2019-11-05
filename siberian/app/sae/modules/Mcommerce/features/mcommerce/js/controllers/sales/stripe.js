/*global
 App, BASE_PATH, Stripe
 */

angular.module("starter").controller("MCommerceSalesStripeViewController", function (Loader, $scope, $state,
                                                                                     $stateParams, $timeout, $translate,
                                                                                     Customer, McommerceStripe, Dialog) {

    $scope.is_loading = true;
    Loader.show();
    $scope.value_id = $stateParams.value_id;
    McommerceStripe.value_id = $stateParams.value_id;
    $scope.card = {};
    $scope.payment = {};
    $scope.payment.save_card = false;
    $scope.payment.use_stored_card = false;

    $scope.cardElement = null;

    $scope.loadContent = function () {
        $scope.guest_mode = Customer.guest_mode;
        var cust_id = null;
        if (Customer.isLoggedIn()) {
            cust_id = Customer.id;
        }

        //reset save card param
        $scope.payment.save_card = false;

        McommerceStripe
        .find(cust_id)
        .then(function (data) {

            // Mcommerce stripe instance! (fallback)
            McommerceStripe.StripeInstance = Stripe(data.publishable_key);

            $scope.cart_total = data.total;

            // Load previously saved card!
            if (data.card && data.card.exp_year) {
                $scope.card = data.card;
                $scope.payment.use_stored_card = true;
            }

            $scope.mountCard();

        }).then(function () {
            $scope.is_loading = false;
            Loader.hide();
        });

    };

    $scope.mountCard = function () {
        var cardElementParent = document.getElementById("mcommerce-card-element");
        try {
            cardElementParent.firstChild.remove();
        } catch (e) {
            // Silent!
        }

        var elements = McommerceStripe.StripeInstance.elements();
        var style = {
            base: {
                color: "#32325d",
                fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                fontSmoothing: "antialiased",
                fontSize: "16px",
                "::placeholder": {
                    color: "#aab7c4"
                }
            },
            invalid: {
                color: "#fa755a",
                iconColor: "#fa755a"
            }
        };

        $scope.cardElement = elements.create("card", {
            hidePostalCode: true,
            style: style
        });

        var saveElement = document.getElementById("mcommerce-save-element");
        var displayError = document.getElementById("mcommerce-card-errors");
        var displayErrorParent = document.getElementById("mcommerce-card-errors-parent");

        saveElement.setAttribute("disabled", "disabled");

        $scope.cardElement.removeEventListener("change");
        $scope.cardElement.addEventListener("change", function (event) {
            if (event.error) {
                displayErrorParent.classList.remove("ng-hide");
                displayError.textContent = event.error.message;
                saveElement.setAttribute("disabled", "disabled");
            } else {
                displayErrorParent.classList.add("ng-hide");
                displayError.textContent = "";
                saveElement.removeAttribute("disabled");
            }
        });

        $scope.cardElement.mount("#mcommerce-card-element");
    };

    $scope.validateCard = function () {
        $scope.process();
    };

    $scope.deleteVault = function () {
        Dialog
        .confirm(
            "Confirmation",
            "Do you confirm you want to remove your card?",
            ["Yes", "No"])
        .then(function (result) {
            if (result) {
                $scope.is_loading = true;
                Loader.show();
                //we cannot be there without customer
                McommerceStripe
                .removeCard(Customer.id)
                .then(function (data) {
                    $scope.oldcard = $scope.card;
                    $scope.card = {};
                    $scope.payment.use_stored_card = false;
                }).then(function () {
                    $scope.is_loading = false;
                    Loader.hide();
                });
            }
        });

    };

    $scope.process = function () {
        if (!$scope.is_loading) {
            $scope.is_loading = true;
            Loader.show();
            if ($scope.payment.use_stored_card) {
                _process();
            } else {
                McommerceStripe.StripeInstance.createToken(cardElement, function (response) {
                    _stripeResponseHandler(response);
                });
            }
        }
    };

    var _stripeResponseHandler = function (response) {
        console.log("_stripeResponseHandler", response);
        if (response.error) {
            Dialog.alert("", response.error.message, "OK");
            $scope.is_loading = false;
            Loader.hide();
        } else {
            $scope.card = {
                token: response.id,
                last4: response.card.last4,
                brand: response.card.brand,
                exp_month: response.card.exp_month,
                exp_year: response.card.exp_year,
                exp: Math.round(+(new Date((new Date(response.card.exp_year, response.card.exp_month, 1)) - 1)) / 1000) | 0
            };

            _process();
        }
    };

    //function to make payment when all is ready
    var _process = function () {
        var data = {
            "token": $scope.card.token,
            "use_stored_card": $scope.payment.use_stored_card,
            "save_card": $scope.payment.save_card,
            "customer_id": Customer.id || null
        };

        McommerceStripe
        .process(data)
        .then(function (res) {
            if (res) {
                $state.go("mcommerce-sales-success", {value_id: $stateParams.value_id});
            } else {
                Dialog.alert("Error", "Unexpected error", "OK");
            }
        }, function (err) {
            Dialog.alert("Error", "Unexpected error", "OK");
        }).then(function () {
            $scope.is_loading = false;
            Loader.hide();
        });
    };

    $scope.right_button = {
        action: $scope.process,
        label: $translate.instant("Pay")
    };

    $scope.loadContent();

});