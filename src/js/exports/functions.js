import * as classNames from "./classNames.js";
import * as regexes from "./regexes.js";
let abortController = new AbortController();

function makeStruct(names) {
    var names = names.split(' ');
    var count = names.length;
    function constructor() {
      for (var i = 0; i < count; ++i) {
        this[names[i]] = arguments[i];
      }
    }
    return constructor;
}

function isScrollInRange(element, scroll) {
    let rect = element.getBoundingClientRect();

    return isInRange(scroll + 100, rect.top + scroll, rect.top + scroll + rect.height);
}

function isInRange(valueToCheck, min, max) {
    return valueToCheck >= min && valueToCheck < max;
}

// Validators

function validateEmail(emailInput) {
    
    const emailString = emailInput.value;
    if (!regexes.email.test(emailString)) {
        emailInput.classList.add(classNames.invalid);
        return false;
    }

    return true;
}

function validatePhoneNumber(numberInput) {
    
    const number = numberInput.value;
    if (number !== '' && !regexes.phoneNumber.test(number)) {
        numberInput.classList.add(classNames.invalid);
        return false;
    }
    return true;
}

function validateFill(textInput) {
    
    const string = textInput.value;
    if (string === null || string === '') {
        textInput.classList.add(classNames.invalid);
        return false;
    }
    return true;
}

export { makeStruct, isScrollInRange, isInRange, validateEmail, validatePhoneNumber, validateFill };