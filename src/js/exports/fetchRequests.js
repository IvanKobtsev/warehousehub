import * as links from "./links.js";

async function sendAddWarehouseForm(formData) {

    const response = await fetch(links.api + 'include-warehouse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(formData)
    });

    return response; 
}

export { sendAddWarehouseForm }