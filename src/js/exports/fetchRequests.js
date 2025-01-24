import { showErrorDialog } from "./eventListeners.js";
import * as links from "./links.js";
import * as regexes from "./regexes.js";

async function getMainData() {

    return await fetch(links.api + 'api/main');
}

async function sendAddWarehouseForm(formData) {

    return await fetch(links.api + 'include-warehouse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(formData)
    });
}

async function getWarehouseData(id) {
    
    const response = await fetch(links.api + `warehouses/${id}`);

    if (response.ok) {
        return await response.json();
    }
    else {
        showErrorDialog();
    }
}

async function getWarehousesPage(query) {
    
    const response = await fetch(query);

    return await response.json();
}

async function getAllWarehouses(query) {

    if (regexes.limitInQuery.test(query)) {
        query = query.replace(regexes.limitInQuery, '&limit=2147483647');
    }
    else if (query.includes('?')) {
        query += '&limit=2147483647';
    }
    else {
        query += '?&limit=2147483647';
    }

    query = query.replace(regexes.offsetInQuery, '');

    const response = await fetch(query);

    return await response.json();
}

async function getCitiesPropertyList() {
    
    const response = await fetch(links.api + 'city-property-list');

    if (response.ok) {
        return await response.json();
    }
    else {
        showErrorDialog();
    }
}

async function getWarehousesCoordinates() {
    
    const response = await fetch(links.api + 'warehouses-coordinates');

    if (response.ok) {
        return (await response.json()).results;
    }
    else {
        showErrorDialog();
    }
}

export { getMainData, sendAddWarehouseForm, getWarehouseData, getWarehousesPage, getCitiesPropertyList, getAllWarehouses, getWarehousesCoordinates }