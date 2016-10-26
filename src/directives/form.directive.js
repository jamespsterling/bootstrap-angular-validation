'use strict';

/**
 * @ngdoc directive
 * @name form
 * @description Using "form" element as directive so we don't require to put the "bs-validation" directive to every form
 * element.
 */
angular.module('bootstrap.angular.validation').directive('form', [
  '$parse', 'BsValidationService',
  function($parse, validationService) {
    return {
      restrict: 'E',
      require: 'form',
      priority: 1000,     // Setting a higher priority so that this directive compiles first.
      compile: function($formElement, $formAttributes) {
          if (validationService.isValidationDisabled($formElement)) {
            return;
          }

          // Disable HTML5 validation display
          $formElement.attr('novalidate', 'novalidate');

          var ngSubmit = $formAttributes.ngSubmit;
          /*
           * Removing ngSubmit attribute if any since ngSubmit by default doesn't respects the validation errors
           * on the input fields.
           */
          delete $formAttributes.ngSubmit;

          var preLinkFunction = function($scope, formElement, $attr, formController) {
            // Expose a method to manually show the validation state
            formController.$showValidation = function() {
                formController.$setSubmitted();
                // Tell form elements to show validation state
                $scope.$broadcast('onBsValidationStateChange', {showValidationState: true});
            };

            formController.$hideValidation = function () {
              formController.$setPristine();
              // Tell form elements to hide validation state
              $scope.$broadcast('onBsValidationStateChange', {showValidationState: false});
            };

            var markPristineAfterSubmit = formElement[0].attributes.hasOwnProperty('bs-pristine-on-submit');

            formElement.on('submit', function(e) {
              // If any of the form element has not passed the validation
              if (formController.$invalid) {
                // Then focus the first invalid element
                formElement[0].querySelector('.ng-invalid').focus();
                return false;
              }

              // Parse the handler of ng-submit & execute it
              var submitHandler = $parse(ngSubmit);
              $scope.$apply(function() {
                submitHandler($scope, {$event: e});

                formController.$commitViewValue();
                formController.$setSubmitted();

                if (markPristineAfterSubmit) {
                  formController.$hideValidation();
                }
              });

              if (markPristineAfterSubmit) {
                /**
                 * Prevent other submit event listener registered via Angular so that we can mark the form with
                 * the pristine state. Otherwise, that Angular's listener is getting called at the last and is again
                 * setting form to the submitted.
                 *
                 * https://api.jquery.com/event.stopimmediatepropagation/
                 */
                e.stopImmediatePropagation();
                e.preventDefault();
              }

              return true;
            });
          };

          return {
            pre: preLinkFunction
          };
      }
    };
}]);
