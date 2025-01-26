import * as functions from "./functions.js";
import * as fetchRequests from "./fetchRequests.js";
import { api } from "./links.js";
import { showErrorDialog } from "./eventListeners.js";

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

    const delta = Math.max((maxLng - minLng) / 10, (maxLat - minLat) / 10);

    return [
        [minLng - delta, minLat - delta],
        [maxLng + delta, maxLat + delta]
    ];
}

try {
    await ymaps3.ready;
}
catch {
    document.getElementsByTagName('body')[0].classList.remove('loading');
    
    showErrorDialog();
}

const location = {
    center: [37.588144, 55.733842],
    zoom: 13
};

function success(position) {
    location.center = [position.coords.longitude, position.coords.latitude];
    initMap(true);
}

function error() {
    // alert("Sorry, no position available.");
}

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(success, error);
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
    
    const markerWrapper = document.createElement('div');
    markerWrapper.className = 'map-point-wrapper';

    const markerImg = document.createElement('img');
    
    if (feature.properties.is_big_map_photo) {
        markerImg.className = 'map-marker';
        if (feature.properties.logo !== null) markerImg.src = api + feature.properties.logo.substring(1);
    }
    else {
        markerImg.className = 'map-point';
    }

    if (feature.properties.is_colored) {
        markerImg.classList.add('colored');
    }

    if (feature.properties.is_trust_marked) {
        markerImg.classList.add('trusted');
    }

    markerImg.warehouseId = feature.id;
    markerImg.addEventListener('click', markerClick);

    markerWrapper.appendChild(markerImg);

    return new YMapMarker(
        {
            coordinates: feature.geometry.coordinates
        },
        markerWrapper
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

async function initMap(resetLocation = false) {

    if (map !== null) {

        if (!resetLocation) {
            location.center = map.center;
            location.zoom = map.zoom;
        }

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
                    is_big_map_photo: point.is_big_map_photo,
                    is_trust_marked: point.is_trust_marked,
                    is_colored: point.is_colored
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
                is_big_map_photo: point.is_big_map_photo,
                is_trust_marked: point.is_trust_marked,
                is_colored: point.is_colored
            }
        });
    });

    const clusterer = new YMapClusterer({
        method: clusterByGrid({gridSize: 64}),
        features: mapPoints,
        marker,
        cluster
    });
    map.addChild(clusterer);
}

export { initMap }