import * as classNames from "./classNames.js";
import * as regexes from "./regexes.js";
import * as fetchRequests from "./fetchRequests.js";
import * as htmlElements from "./htmlElements.js";
import * as yandexMap from "./yandexMap.js";
import * as links from "./links.js";
import { warehouseDetailsModalDialog } from "./dom.js";
import { cancelInvalidStatus, showErrorDialog } from "./eventListeners.js";

let warehousesList = [],
warehousesPagination;

const warehousesFilters = {
    limit: 4,
    offset: 0,
    currentPage: 1,
    properties: [],
    address: null,
    classes: [],
    squareMin: null,
    squareMax: null
},
popularWarehouses = [];

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

function filterByInnerText(event) {

    event.target.parentNode.querySelectorAll('.selectable-filter').forEach(selectable => {
        if (selectable.innerText.toLowerCase().includes(event.target.value.toLowerCase())) {
            selectable.classList.remove('hidden');
        }
        else {
            selectable.classList.add('hidden');
        }
    });

}

function listToQuery(list) {

    let propsQuery = '';

    list.forEach(prop => propsQuery += prop + ',' );

    return '&properties=' + propsQuery.substring(0, propsQuery.length - 1);
}

async function reloadWarehousesPage(displayInUrl = true) {

    let isValid = true;

    isValid = validateRange(document.getElementById('findWarehouseSectionSquareMinFilter'), document.getElementById('findWarehouseSectionSquareMaxFilter')) && isValid;

    if (isValid) {

        warehousesFilters.currentPage = 1;
        warehousesFilters.offset = null;
        warehousesFilters.limit = null;
        warehousesFilters.properties = [];
        warehousesFilters.address = null;
        warehousesFilters.classes = [];
        warehousesFilters.squareMin = null;
        warehousesFilters.squareMax = null;

        const cityFilter = document.getElementById('findWarehouseSectionCitiesFilter').querySelector('.filter');
        if (cityFilter !== null) warehousesFilters.address = cityFilter.innerText;

        const squareMinFilter = document.getElementById('findWarehouseSectionSquareMinFilter');
        if (squareMinFilter.value !== '') {
            warehousesFilters.squareMin = squareMinFilter.value;
        }

        const squareMaxFilter = document.getElementById('findWarehouseSectionSquareMaxFilter');
        if (squareMaxFilter.value !== '') {
            warehousesFilters.squareMax = squareMaxFilter.value;
        }

        const propsFilters = document.getElementById('findWarehouseSectionPropertiesFilter').querySelectorAll('.filter');
        if (propsFilters !== null && propsFilters.length > 0) {
            propsFilters.forEach(filter => {
                warehousesFilters.properties.push(filter.innerText);
            });
        }

        const classFilters = document.getElementById('findWarehouseSectionClassFilter').querySelectorAll('.filter');
        if (classFilters !== null && classFilters.length > 0) {
            classFilters.forEach(filter => {
                warehousesFilters.classes.push(filter.innerText);
            });
        }

        let query = links.api + 'warehouses/';

        if (warehousesFilters.offset !== null) query += '&offset=' + warehousesFilters.offset;

        if (warehousesFilters.limit !== null) query += '&limit=' + warehousesFilters.limit;

        if (warehousesFilters.address !== null) query += '&address=' + warehousesFilters.address;

        if (warehousesFilters.squareMin !== null) query += '&square_from=' + warehousesFilters.squareMin;

        if (warehousesFilters.squareMax !== null) query += '&square_to=' + warehousesFilters.squareMax;

        if (warehousesFilters.properties.length > 0) query += listToQuery(warehousesFilters.properties);

        if (warehousesFilters.classes.length > 0) query += listToQuery(warehousesFilters.classes);

        query = query.replace('/&', '/?&');
        
        await loadWarehousesPage(query, displayInUrl);
    }
}

function validateRange(minInput, maxInput) {
    
    let minValue, maxValue,
    minBorder = parseInt(minInput.getAttribute('placeholder')), 
    maxBorder = parseInt(maxInput.getAttribute('placeholder')),
    isValid = true;

    if (minInput.value === '') {
        minValue = parseInt(minInput.getAttribute('placeholder'));
    }
    else if (regexes.number.test(minInput.value)) {
        minValue = parseInt(minInput.value);
    }
    else {
        isValid = false;
    }

    if (maxInput.value === '') {
        maxValue = parseInt(maxInput.getAttribute('placeholder'));
    }
    else if (regexes.number.test(maxInput.value)) {
        maxValue = parseInt(maxInput.value);
    }
    else {
        isValid = false;
    }

    if (isNaN(minValue) || minValue < 0 || minValue > maxBorder) {
        isValid = false;
        minInput.classList.add('invalid');
    }

    if (isNaN(maxValue) || maxValue < 0 || maxValue > maxBorder) {
        isValid = false;
        maxInput.classList.add('invalid');
    }

    if (isValid && minValue > maxValue) {
        isValid = false;
        minInput.classList.add('invalid');
        maxInput.classList.add('invalid');
    }
    
    if (isValid) {
        minInput.classList.remove('invalid');
        maxInput.classList.remove('invalid');
    }

    return isValid;
}

function selectFilter(event) {
    
    if (event.target.classList.contains('active')) {
        event.target.classList.remove('active');

        event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').forEach(filter => {
            if (filter.innerText === event.target.innerText) {
                filter.remove();
            }
        });

        if (event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').length === 0) {
            const noFilter = document.createElement('div');
            noFilter.className = 'no-filter';
            noFilter.innerText = '[без фильтра]';
            event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').appendChild(noFilter);
        }
    }
    else {
        event.target.classList.add('active');

        const selectedFilter = event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').querySelector('.filter');
        if (selectedFilter !== null) {
            selectedFilter.parentNode.parentNode.querySelectorAll('.selectable-filter.active').forEach(selectable => {
                if (selectable.innerText === selectedFilter.innerText) {
                    selectable.classList.remove('active');
                }
            });
        
            if (selectedFilter.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').length === 1) {
                const noFilter = document.createElement('div');
                noFilter.className = 'no-filter';
                noFilter.innerText = '[без фильтра]';
                selectedFilter.parentNode.parentNode.querySelector('.input-filters').appendChild(noFilter);
            }
        
            selectedFilter.remove();
        }

        const noFilter = event.target.parentNode.parentNode.parentNode.querySelector('.no-filter');
        if (noFilter !== null) noFilter.remove();

        const newFilter = document.createElement('div');
        newFilter.className = 'filter';
        newFilter.innerText = event.target.innerText;
        newFilter.addEventListener('click', removeFilter);

        event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').appendChild(newFilter);
    }

    reloadWarehousesPage();
}

function removeFilter(event) {

    event.target.parentNode.parentNode.querySelectorAll('.selectable-filter.active').forEach(selectable => {
        if (selectable.innerText === event.target.innerText) {
            selectable.classList.remove('active');
        }
    });

    if (event.target.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').length === 1) {
        const noFilter = document.createElement('div');
        noFilter.className = 'no-filter';
        noFilter.innerText = '[без фильтра]';
        event.target.parentNode.parentNode.querySelector('.input-filters').appendChild(noFilter);
    }

    event.target.remove();
    reloadWarehousesPage();
}

function toggleFilter(event) {

    if (event.target.classList.contains('active')) {
        event.target.classList.remove('active');

        event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').forEach(filter => {
            if (filter.innerText === event.target.innerText) {
                filter.remove();
            }
        });

        if (event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').querySelectorAll('.filter').length === 0) {
            const noFilter = document.createElement('div');
            noFilter.className = 'no-filter';
            noFilter.innerText = '[без фильтра]';
            event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').appendChild(noFilter);
        }
    }
    else {
        event.target.classList.add('active');

        const noFilter = event.target.parentNode.parentNode.parentNode.querySelector('.no-filter');
        if (noFilter !== null) noFilter.remove();

        const newFilter = document.createElement('div');
        newFilter.className = 'filter';
        newFilter.innerText = event.target.innerText;
        newFilter.addEventListener('click', removeFilter);

        event.target.parentNode.parentNode.parentNode.querySelector('.input-filters').appendChild(newFilter);
    }

    reloadWarehousesPage();
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

async function loadMainData() {
    
    const response = await fetchRequests.getMainData();

    if (response.ok) {
        const result = await response.json();

        // MAIN 
        document.getElementById('mainSectionHeader').innerHTML = result.main.title.replace('<L>', `<span class="${classNames.highlighted}">`).replace('</L>', '</span>');
        document.getElementById('mainSectionText').innerText = result.main.description;
        
        const cardsContainer = document.getElementById('mainSectionDescriptionCards');
        cardsContainer.replaceChildren();

        result.main.description_cards.forEach(cardText => {
            const newCard = document.createElement('div');
            newCard.className = 'main-points-container__point';
            newCard.innerText = cardText;
            cardsContainer.appendChild(newCard);
        });

        // POPULAR WAREHOUSES
        const parser = new DOMParser(),
        newCardTemplate = parser.parseFromString(htmlElements.warehouseCard, 'text/html').querySelector(".warehouse-card"),
        cardsCarousel = document.getElementById('popularWarehousesSectionCarousel');
        
        cardsCarousel.replaceChildren();

        result.populate_warehouses.forEach(cardData => {

            popularWarehouses.push({
                id: cardData.id,
                coordinates: cardData.coordinates,
                logo: cardData.logo,
                is_big_map_photo: cardData.is_big_map_photo
            });

            const newCard = newCardTemplate.cloneNode(true);

            if (cardData.logo === null) {
                newCard.querySelector('.warehouse-card__icon').remove();
            }
            else {
                newCard.querySelector('.warehouse-card__icon').src = links.api + cardData.logo.substring(1);
            }

            newCard.querySelector('.warehouse-card__name').innerText = cardData.title;
            newCard.querySelector('.warehouse-card__address').innerText = cardData.address;

            if (cardData.description !== null && cardData.description.length > 300) {
                newCard.querySelector('.warehouse-card__bottom-text').classList.add('shorted');
                newCard.querySelector('.warehouse-card__bottom-text').innerText = cardData.description.substring(0, 300).trim();
            }
            else {
                newCard.querySelector('.warehouse-card__bottom-text').innerText = cardData.description;
            }
            
            const squareProperty = document.createElement('div');
            squareProperty.className = 'warehouse-card__property';
            squareProperty.innerText = cardData.square + ' м²';
            
            const newCardProperties = newCard.querySelector('.warehouse-card__properties');
            newCardProperties.replaceChildren();
            newCardProperties.appendChild(squareProperty);

            cardData.properties.forEach(property => {
                const newProperty = document.createElement('div');
                newProperty.className = 'warehouse-card__property';
                newProperty.innerText = property;
                newCardProperties.appendChild(newProperty);
            });

            newCard.addEventListener('click', clickOnCard);

            newCard.warehouseId = cardData.id;

            cardsCarousel.appendChild(newCard);
        });

        // ABOUT US
        document.getElementById('aboutUsSectionAmountWarehouses').innerText = result.about_us.amount_warehouses;
        document.getElementById('aboutUsSectionAmountClients').innerText = result.about_us.amount_clients;
        document.getElementById('aboutUsSectionDescription').innerText = result.about_us.description;

        // CONTACTS
        document.getElementById('contactsSectionEmailText').innerText = result.contacts.email;
        document.getElementById('contactsSectionEmailLink').href = "mailto:" + result.contacts.email;

        document.getElementById('contactsSectionTelegramText').innerText = result.contacts.telegram;
        document.getElementById('contactsSectionTelegramLink').href = "https://t.me/" + result.contacts.telegram.substring(1);
    
        // FILTERS 
        const cityPropertyList = await fetchRequests.getCitiesPropertyList();

        // KEYWORDS
        var meta = document.createElement('meta');
        meta.name = "keywords";
        meta.content = cityPropertyList.keywords;
        document.getElementsByTagName('head')[0].appendChild(meta);

        const selectablePropertyFilters = document.getElementById('findWarehouseSectionPropertiesFilter').querySelector('.input-filters__selectable-filters');
        document.getElementById('findWarehouseSectionPropertiesFilter').querySelector('.input-filters__input').addEventListener('input', filterByInnerText);
        document.getElementById('findWarehouseSectionPropertiesFilter').querySelector('.input-filters__input').value = '';

        cityPropertyList.properties.forEach(property => {
            const newProperty = document.createElement('div');
            newProperty.className = 'selectable-filter';
            newProperty.innerText = property;
            newProperty.addEventListener('click', toggleFilter);
            selectablePropertyFilters.appendChild(newProperty);
        });

        document.getElementById('findWarehouseSectionSquareMinFilter').addEventListener('blur', reloadWarehousesPage);
        document.getElementById('findWarehouseSectionSquareMinFilter').addEventListener('focus', cancelInvalidStatus);
        document.getElementById('findWarehouseSectionSquareMaxFilter').addEventListener('blur', reloadWarehousesPage);
        document.getElementById('findWarehouseSectionSquareMaxFilter').addEventListener('focus', cancelInvalidStatus);

        const selectableClassFilters = document.getElementById('findWarehouseSectionClassFilter').querySelector('.input-filters__selectable-filters');
        document.getElementById('findWarehouseSectionClassFilter').querySelector('.input-filters__input').addEventListener('input', filterByInnerText);
        document.getElementById('findWarehouseSectionClassFilter').querySelector('.input-filters__input').value = '';

        cityPropertyList.classes.forEach(property => {
            const newProperty = document.createElement('div');
            newProperty.className = 'selectable-filter';
            newProperty.innerText = property;
            newProperty.addEventListener('click', toggleFilter);
            selectableClassFilters.appendChild(newProperty);
        });

        const selectableCitiesFilters = document.getElementById('findWarehouseSectionCitiesFilter').querySelector('.input-filters__selectable-filters');
        document.getElementById('findWarehouseSectionCitiesFilter').querySelector('.input-filters__input').addEventListener('input', filterByInnerText);
        document.getElementById('findWarehouseSectionCitiesFilter').querySelector('.input-filters__input').value = '';

        cityPropertyList.cities.forEach(property => {
            const newProperty = document.createElement('div');
            newProperty.className = 'selectable-filter';
            newProperty.innerText = property;
            newProperty.addEventListener('click', selectFilter);
            selectableCitiesFilters.appendChild(newProperty);
        });

        await reloadWarehousesPage(false);

        document.getElementsByTagName('body')[0].classList.remove('loading');
         
        // FIND WAREHOUSES
        warehousesList = await fetchRequests.getWarehousesCoordinates();

        yandexMap.initMap();
    }
    else {
        showErrorDialog();
        window.location.reload();
    }
}

async function openWarehouseDetails(warehouseId) {
    
    const warehouseData = await fetchRequests.getWarehouseData(warehouseId);

    warehouseDetailsModalDialog.classList.remove('hidden');

    // HEADER
    if (warehouseData.logo !== null) {
        document.getElementById('fullCardIcon').classList.remove('hidden');
        document.getElementById('fullCardIcon').src = links.api + warehouseData.logo.substring(1);
    }
    else {
        document.getElementById('fullCardIcon').classList.add('hidden');
    }
    
    document.getElementById('fullCardName').innerText = warehouseData.title;
    document.getElementById('fullCardAddress').innerText = warehouseData.address;

    // PROPERTIES   
    const warehousePropsDiv = document.getElementById('fullCardProperties');
    warehousePropsDiv.replaceChildren();

    const squareProperty = document.createElement('div');
    squareProperty.className = 'warehouse-card__property';
    squareProperty.innerText = warehouseData.square + ' м²';
    warehousePropsDiv.appendChild(squareProperty);

    warehouseData.properties.forEach(property => {
        const newProperty = document.createElement('div');
        newProperty.className = 'warehouse-card__property';
        newProperty.innerText = property;
        warehousePropsDiv.appendChild(newProperty);
    });

    document.getElementById('fullCardGreyText').innerText = warehouseData.description;

    // MANAGER
    if (warehouseData.manager.last_name !== null && warehouseData.manager.first_name !== null) {

        document.getElementById('fullCardManagerName').innerText = 
        warehouseData.manager.last_name + " " + warehouseData.manager.first_name + 
        (warehouseData.manager.patronymic === null ? "" : " " + warehouseData.manager.patronymic);

        const contactsDiv = document.getElementById('fullCardContacts');

        const phoneAndEmailDiv = contactsDiv.querySelector('.warehouse-card__phone-and-email');
        if (phoneAndEmailDiv !== null) phoneAndEmailDiv.remove();

        if (warehouseData.manager.email !== null || warehouseData.manager.phone !== null) {

            const newPhoneAndEmailDiv = document.createElement('div');
            newPhoneAndEmailDiv.className = 'warehouse-card__phone-and-email';

            if (warehouseData.manager.phone !== null) {
                const newPhoneDiv = document.createElement('div');
                newPhoneDiv.className = 'warehouse-card__phone copiable';
                newPhoneDiv.innerText = warehouseData.manager.phone;
                newPhoneDiv.addEventListener('click', clickOnCopy);
                newPhoneAndEmailDiv.appendChild(newPhoneDiv);
            }

            if (warehouseData.manager.email !== null) {
                const newEmailDiv = document.createElement('div');
                newEmailDiv.className = 'warehouse-card__email copiable';
                newEmailDiv.innerText = warehouseData.manager.email;
                newEmailDiv.addEventListener('click', clickOnCopy);
                newPhoneAndEmailDiv.appendChild(newEmailDiv);
            }

            contactsDiv.appendChild(newPhoneAndEmailDiv);
        }

        const socialLinksDiv = contactsDiv.querySelector('.warehouse-card__social-links');
        if (socialLinksDiv !== null) socialLinksDiv.remove();

        if (warehouseData.manager.telegram !== null || warehouseData.manager.whatsapp !== null) {

            const newSocialLinksDiv = document.createElement('div');
            newSocialLinksDiv.className = 'warehouse-card__social-links';
            
            if (warehouseData.manager.telegram !== null) {
                const newTelegramDiv = document.createElement('a');
                newTelegramDiv.className = 'warehouse-card__tg-link';
                newTelegramDiv.innerText = warehouseData.manager.telegram;
                newTelegramDiv.setAttribute('href', warehouseData.manager.telegram);
                newTelegramDiv.setAttribute('target', '_blank');
                newSocialLinksDiv.appendChild(newTelegramDiv);
            }

            if (warehouseData.manager.whatsapp !== null) {
                const newWhatsappDiv = document.createElement('a');
                newWhatsappDiv.className = 'warehouse-card__wa-link';
                newWhatsappDiv.innerText = warehouseData.manager.whatsapp;
                newWhatsappDiv.setAttribute('href', 'https://wa.me/' + warehouseData.manager.whatsapp.substring(1));
                newWhatsappDiv.setAttribute('target', '_blank');
                newSocialLinksDiv.appendChild(newWhatsappDiv);
            }

            contactsDiv.appendChild(newSocialLinksDiv);
        }
    }
    else {
        document.getElementById('fullCardContacts').remove();
    }

    // PHOTOS
    const photosDiv = document.getElementById('fullCardPhotos');
    photosDiv.replaceChildren();

    if (warehouseData.photos !== null && warehouseData.photos.length > 0) {
        photosDiv.parentNode.classList.remove('hidden');
    }
    else {
        photosDiv.parentNode.classList.add('hidden');
    }

    warehouseData.photos.forEach(photoLink => {
        const newPhoto = document.createElement('img');
        newPhoto.src = links.api + photoLink.substring(1);
        newPhoto.className = 'warehouse-card__photo';
        photosDiv.appendChild(newPhoto);
    });

    // WEBSITE
    const bottomLink = document.getElementById('fullCardBottomLink');
        
    if (warehouseData.website !== null) {
        bottomLink.classList.remove('hidden');
        bottomLink.href = warehouseData.website;
        bottomLink.innerText = warehouseData.website;
    }
    else {
        bottomLink.classList.add('hidden');
    }
}

function clickOnCard(e) {

    if (e.target.className === 'warehouse-card__properties') {
        openWarehouseDetails(e.target.parentNode.warehouseId);
    }
    else {
        openWarehouseDetails(e.target.warehouseId);
    }
}

async function clickOnCopy(e) {
    navigator.clipboard.writeText(e.target.innerText)
    .then(_ => {
        // Display a popup
    })
}

async function loadWarehousesPage(query = null, displayInUrl = true) {

    if (query === null) query = links.api + 'warehouses';

    document.getElementById('findWarehouseSectionPageList').classList.add('loading');    

    if (displayInUrl) {
        window.history.replaceState({}, '', '/' + query.substring(28));
    }
    
    warehousesPagination = await fetchRequests.getWarehousesPage(query);

    document.getElementById('findWarehouseSectionPageList').classList.remove('loading');

    // LIST
    const parser = new DOMParser(),
    newCardTemplate = parser.parseFromString(htmlElements.warehouseCard, 'text/html').querySelector(".warehouse-card"),
    findWarehouseSectionPageList = document.getElementById('findWarehouseSectionPageList');

    newCardTemplate.querySelector('.warehouse-card__bottom-text').remove();
    
    findWarehouseSectionPageList.replaceChildren();

    warehousesPagination.results.forEach(cardData => {
        const newCard = newCardTemplate.cloneNode(true);

        if (cardData.logo === null) {
            newCard.querySelector('.warehouse-card__icon').remove();
        }
        else {
            newCard.querySelector('.warehouse-card__icon').src = links.api + cardData.logo.substring(1);
        }

        newCard.querySelector('.warehouse-card__name').innerText = cardData.title;
        newCard.querySelector('.warehouse-card__address').innerText = cardData.address;
        
        const squareProperty = document.createElement('div');
        squareProperty.className = 'warehouse-card__property';
        squareProperty.innerText = cardData.square + ' м²';
        
        const newCardProperties = newCard.querySelector('.warehouse-card__properties');
        newCardProperties.replaceChildren();
        newCardProperties.appendChild(squareProperty);

        cardData.properties.forEach(property => {
            const newProperty = document.createElement('div');
            newProperty.className = 'warehouse-card__property';
            newProperty.innerText = property;
            newCardProperties.appendChild(newProperty);
        });

        newCard.addEventListener('click', clickOnCard);

        newCard.warehouseId = cardData.id;

        findWarehouseSectionPageList.appendChild(newCard);
    });
    
    // PAGINATION
    const paginationBlock = document.getElementById('findWarehouseSectionPagination');
    paginationBlock.replaceChildren();

    if (warehousesPagination.previous !== null) {
        const newPageLink = document.createElement('div');
        newPageLink.className = 'page';
        newPageLink.innerText = '<';
        newPageLink.addEventListener('click', () => {
            warehousesFilters.currentPage--;
            loadWarehousesPage(warehousesPagination.previous.replace('http', 'https'));
        });
        paginationBlock.appendChild(newPageLink);
    }

    const newPageLink = document.createElement('div');
    newPageLink.className = 'page selected';
    newPageLink.innerText = warehousesFilters.currentPage;
    paginationBlock.appendChild(newPageLink);

    if (warehousesPagination.next !== null) {
        const newPageLink = document.createElement('div');
        newPageLink.className = 'page';
        newPageLink.innerText = '>';
        newPageLink.addEventListener('click', () => {
            warehousesFilters.currentPage++;
            loadWarehousesPage(warehousesPagination.next.replace('http', 'https'));
        });
        paginationBlock.appendChild(newPageLink);
    }
    
    if (warehousesPagination.results.length === 0) {
        document.getElementById('findWarehouseSectionPageList').classList.add('empty');
    }
    else {
        document.getElementById('findWarehouseSectionPageList').classList.remove('empty');
    }

    // YANDEX MAP

    const filteredWarehouses = await fetchRequests.getAllWarehouses(query);

    warehousesList = [];
    
    filteredWarehouses.results.forEach(warehouse => {
        warehousesList.push({
            id: warehouse.id,
            coordinates: warehouse.coordinates,
            is_big_map_photo: warehouse.is_big_map_photo,
            logo: warehouse.logo
        });
    });

    yandexMap.initMap();

}

export { makeStruct, isScrollInRange, isInRange, validateEmail, validatePhoneNumber, validateFill, loadMainData, openWarehouseDetails, warehousesList, warehousesFilters, popularWarehouses, reloadWarehousesPage, loadWarehousesPage };