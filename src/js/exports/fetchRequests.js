import * as links from "./links.js";

async function getMainData() {

    return await fetch(links.api + 'api/main');
}

async function sendAddWarehouseForm(formData) {

    return await fetch(links.api + 'include-warehouse', {
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
        alert("Что-то пошло не так!");
    }
}

async function getWarehousesPage(query) {
    
    const response = await fetch(query);

    return await response.json();
}

async function getCitiesPropertyList() {
    
    const response = await fetch(links.api + 'city-property-list');

    if (response.ok) {
        return await response.json();
    }
    else {
        alert("Что-то пошло не так!");
    }
}

export { getMainData, sendAddWarehouseForm, getWarehouseData, getWarehousesPage, getCitiesPropertyList }