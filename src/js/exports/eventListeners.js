import * as domElements from "./dom.js";
import * as classNames from "./classNames.js";
import * as strings from "./strings.js";
import * as functions from "./functions.js";
import * as fetchRequests from "./fetchRequests.js";

function cancelInvalidStatus(event) {
    event.target.classList.remove(classNames.invalid);
}

function openFilterSelection(event) {
    event.target.parentNode.parentNode.classList.toggle('active');
}

function closeModalDialog(event) {
    event.target.parentNode.parentNode.classList.add('hidden');
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

    if (functions.isScrollInRange(domElements.mainSection, scroll)) {
        selectNavElement(domElements.mainSectionNav);
    }
    else if (functions.isScrollInRange(domElements.warehousesSection, scroll)) {
        selectNavElement(domElements.warehousesSectionNav);
    }
    else if (functions.isScrollInRange(domElements.aboutUsSection, scroll)) {
        selectNavElement(domElements.aboutUsSectionNav);
    }
    else if (functions.isScrollInRange(domElements.contactsSection, scroll)) {
        selectNavElement(domElements.contactsSectionNav);
    }
    else if (functions.isScrollInRange(domElements.addWarehouseSection, scroll)) {
        selectNavElement(domElements.addWarehouseSectionNav);
    }
}

async function sendForm(event) {

    event.preventDefault();

    let valid = true;

    valid = functions.validateEmail(domElements.addWarehouseFormEmail);
    valid = functions.validateFill(domElements.addWarehouseFormName) && valid;
    valid = functions.validateFill(domElements.addWarehouseFormWarehouseName) && valid;
    valid = functions.validateFill(domElements.addWarehouseFormWarehouseAddress) && valid;

    if (valid) {
        let response = await fetchRequests.sendAddWarehouseForm({
            requester_name: domElements.addWarehouseFormName.value,
            requester_email: domElements.addWarehouseFormEmail.value,
            requester_warehouse_name: domElements.addWarehouseFormWarehouseName.value,
            requester_warehouse_address: domElements.addWarehouseFormWarehouseAddress.value,
            requester_comment: domElements.addWarehouseFormComment.value.length === 0 ? null : domElements.addWarehouseFormComment.value
        });

        if (response.ok) {
            showSentFormDialog();
            domElements.addWarehouseFormName.value = domElements.addWarehouseFormEmail.value = domElements.addWarehouseFormWarehouseName.value = 
            domElements.addWarehouseFormWarehouseAddress.value = domElements.addWarehouseFormComment.value = "";
            // window.location.reload();
        }
        else {
            showErrorDialog();
        }
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

    if (functions.warehousesFilters.currentPage === 1) {
        functions.reloadWarehousesPage();
    }
});
domElements.findWarehouseSwitchRight.addEventListener('click', (e) => {
    e.target.parentNode.classList.remove('switch-left');
    e.target.parentNode.classList.add('switch-right');
    domElements.findWarehouseView.classList.remove('left-view');
    domElements.findWarehouseView.classList.add('right-view');
});

domElements.findWarehouseFilterButton.addEventListener('click', () => {
    domElements.findWarehouseFilterForm.classList.toggle('hidden');
});

domElements.findWarehouseView.addEventListener('click', () => {
    domElements.findWarehouseFilterForm.classList.add('hidden');
});

// FILTERS
document.getElementById('findWarehouseSectionPropertiesFilter').querySelector('.input-filters__add-filter').addEventListener('click', openFilterSelection);
document.getElementById('findWarehouseSectionCitiesFilter').querySelector('.input-filters__add-filter').addEventListener('click', openFilterSelection);
document.getElementById('findWarehouseSectionClassFilter').querySelector('.input-filters__add-filter').addEventListener('click', openFilterSelection);

// FORM

domElements.addWarehouseFormSubmit.addEventListener('click', sendForm);
domElements.addWarehouseFormEmail.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormName.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormWarehouseName.addEventListener('focus', cancelInvalidStatus);
domElements.addWarehouseFormWarehouseAddress.addEventListener('focus', cancelInvalidStatus);

document.getElementById('fullCardCloseButton').addEventListener('click', () => {
    domElements.warehouseDetailsModalDialog.classList.add('hidden');
});

domElements.warehouseDetailsModalDialog.addEventListener('click', e => {
    if (e.target.id === domElements.warehouseDetailsModalDialog.id) domElements.warehouseDetailsModalDialog.classList.add('hidden');
})

// MODAL DIALOGS

document.getElementById('sentFormDialog').addEventListener('click', closeModalDialog);
document.getElementById('errorDialog').addEventListener('click', closeModalDialog);

function showSentFormDialog() {
    document.getElementById('sentFormDialog').classList.remove('hidden');
}

function showErrorDialog() {
    document.getElementById('errorDialog').classList.remove('hidden');
}

export { updateNav, cancelInvalidStatus, showErrorDialog, showSentFormDialog }