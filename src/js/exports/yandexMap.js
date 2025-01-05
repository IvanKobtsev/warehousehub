import * as functions from "./functions.js";
import * as fetchRequests from "./fetchRequests.js";
import { api } from "./links.js";

function getBounds(coordinates) {
    let minLat = Infinity,
        minLng = Infinity;
    let maxLat = -Infinity,
        maxLng = -Infinity;

    for (const coords of coordinates) {
        const lat = coords[1];
        const lng = coords[0];

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
    }

    return [
        [minLng, minLat],
        [maxLng, maxLat]
    ];
}

const location = {
    center: [37.588144, 55.733842], // starting position [lng, lat]
    zoom: 13 // starting zoom
};

try {
    await ymaps3.ready;
}
catch {
    alert("Яндекс.карты не загрузились!");
}

const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapLayer, YMapFeatureDataSource, YMapMarker} = ymaps3;
ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
    '@yandex/ymaps3-clusterer@0.0.10'
]);
const {YMapClusterer, clusterByGrid} = await ymaps3.import('@yandex/ymaps3-clusterer');


async function markerClick(e) {
    functions.openWarehouseDetails(e.target.warehouseId);
}

const marker = (feature) => {

    // let foundWarehouse;

    // functions.warehousesList.forEach(warehouse => {
    //     if (warehouse.id == feature.id) {
    //         foundWarehouse = warehouse;
    //     }
    // });
    
    const markerImg = document.createElement('img');
    
    if (feature.properties.is_big_map_photo) {
        markerImg.className = 'map-marker';
        if (feature.properties.logo !== null) markerImg.src = api + feature.properties.logo.substring(1);
    }
    else {
        markerImg.className = 'map-point';
    }

    markerImg.warehouseId = feature.id;
    markerImg.addEventListener('click', markerClick);

    return new YMapMarker(
        {
            coordinates: feature.geometry.coordinates
        },
        markerImg
    );
};

const cluster = (coordinates, features) =>
    new YMapMarker(
        {
            coordinates,
            onClick() {
                const bounds = getBounds(features.map((feature) => feature.geometry.coordinates));
                map.update({location: {bounds, easing: 'ease-in-out', duration: 2000}});
            }
        },
        circle(features.length).cloneNode(true)
    );

function circle(count) {
    const circle = document.createElement('div');
    circle.classList.add('cluster-circle');
    circle.innerText = '+' + count;
    return circle;
}

let map = null;

async function initMap() {
    
    if (map !== null) {

        location.center = map.center;
        location.zoom = map.zoom;

        map.destroy();
    }

    map = new YMap(document.getElementById('yandexMap'), {
        location: location,
        showScaleInCopyrights: true
    },
    [   
        new YMapDefaultSchemeLayer({}),
        new YMapDefaultFeaturesLayer({})
    ]);

    map
    .addChild(new YMapDefaultSchemeLayer())
    .addChild(new YMapFeatureDataSource({id: 'my-source'}))
    .addChild(new YMapLayer({source: 'my-source', type: 'markers', zIndex: 1800}));

    const mapPoints = [];
    
    functions.warehousesList.forEach(point => {

        let isPopular = false;

        for (const popularPoint of functions.popularWarehouses) {
            if (popularPoint.id === point.id) {
                isPopular = true;
                break;
            }
        }

        if (!isPopular) {
            mapPoints.push({
                type: 'Feature',
                id: point.id,
                geometry: {type: 'Point', coordinates: [point.coordinates.lon, point.coordinates.lat]},
                properties: {
                    logo: point.logo,
                    is_big_map_photo: point.is_big_map_photo
                }
            });
        }
    });

    functions.popularWarehouses.forEach(point => {
        mapPoints.push({
            type: 'Feature',
            id: point.id,
            geometry: {type: 'Point', coordinates: [point.coordinates.lon, point.coordinates.lat]},
            properties: {
                logo: point.logo,
                is_big_map_photo: point.is_big_map_photo
            }
        });
    });
    
    // const points2 = [{
    //     type: 'Feature',
    //     id: 1,
    //     geometry: {type: 'Point', coordinates: [37.588144, 55.733842]},
    //     properties: {
    //         name: 'marker',
    //         description: ''
    //     }
    // },
    // {
    //     type: 'Feature',
    //     id: 2,
    //     geometry: {type: 'Point', coordinates: [37.588344, 55.733142]},
    //     properties: {
    //         name: 'marker',
    //         description: ''
    //     }
    // }];

    // mapPoints = points2;

    const clusterer = new YMapClusterer({
        method: clusterByGrid({gridSize: 64}),
        features: mapPoints,
        marker,
        cluster
    });
    map.addChild(clusterer);
}

export { initMap }