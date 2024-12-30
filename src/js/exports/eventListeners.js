import * as domElements from "./dom.js";
import * as classNames from "./classNames.js";
import * as strings from "./strings.js";
import * as functions from "./functions.js";
import * as fetchRequests from "./fetchRequests.js";

function cancelInvalidStatus(event) {
    event.target.classList.remove(classNames.invalid);
}

// NAVIGATION

function selectNavElement(element) {

    let selectedElement = domElements.navWrapper.querySelector('.selected');
    if (selectedElement !== null) selectedElement.classList.remove('selected');

    element.classList.add(classNames.selected);
}

function navElementClick(event) {
    window.scrollTo({ top: window.scrollY + document.getElementById(event.target.getAttribute('data-scroll-to-id')).getBoundingClientRect().top - 80, 
        behavior: 'smooth' });
}

function updateNav() {
    
    let scroll = window.scrollY;

    if (scroll < 520) {
        selectNavElement(domElements.mainSectionNav);
    }
    else if (scroll >= 520 && scroll < 1970) {
        selectNavElement(domElements.warehousesSectionNav);
    }
    else if (scroll >= 1970 && scroll < 2850) {
        selectNavElement(domElements.aboutUsSectionNav);
    }
    else if (scroll >= 2940 && scroll < 3830) {
        selectNavElement(domElements.contactsSectionNav);
    }
    else if (scroll >= 3830) {
        selectNavElement(domElements.addWarehouseSectionNav);
    }
}

domElements.mainSectionNav.addEventListener('click', navElementClick);
domElements.warehousesSectionNav.addEventListener('click', navElementClick);
domElements.aboutUsSectionNav.addEventListener('click', navElementClick);
domElements.contactsSectionNav.addEventListener('click', navElementClick);
domElements.addWarehouseSectionNav.addEventListener('click', navElementClick);
window.addEventListener('scroll', updateNav);

// FIND WAREHOUSE

domElements.findWarehouseSwitchLeft.addEventListener('click', (e) => {
    e.target.parentNode.classList.remove('switch-right');
    e.target.parentNode.classList.add('switch-left');
    domElements.findWarehouseView.classList.remove('right-view');
    domElements.findWarehouseView.classList.add('left-view');
});
domElements.findWarehouseSwitchRight.addEventListener('click', (e) => {
    e.target.parentNode.classList.remove('switch-left');
    e.target.parentNode.classList.add('switch-right');
    domElements.findWarehouseView.classList.remove('left-view');
    domElements.findWarehouseView.classList.add('right-view');
});

// FORM

domElements.addWarehouseFormSubmit.addEventListener('click', (e) => {

    e.preventDefault();

    let valid = true;

    valid = functions.validateEmail(domElements.addWarehouseFormEmail);
    valid = functions.validateFill(domElements.addWarehouseFormName) && valid;
    valid = functions.validateFill(domElements.addWarehouseFormWarehouseName) && valid;
    valid = functions.validateFill(domElements.addWarehouseFormWarehouseAddress) && valid;

    if (valid) {
        fetchRequests.sendAddWarehouseForm({
            name: domElements.addWarehouseFormName.value,
            email: domElements.addWarehouseFormEmail.value,
            warehouseName: domElements.addWarehouseFormWarehouseName,
            warehouseAddress: domElements.addWarehouseFormWarehouseAddress,
            comment: domElements.addWarehouseFormComment
        });
    }
})
domElements.addWarehouseFormEmail.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormName.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormWarehouseName.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormWarehouseAddress.addEventListener('focus', cancelInvalidStatus);

export { updateNav }