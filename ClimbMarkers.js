let markersVisible = false;

// Function to display markers
map.on('load', () => {
    map.addSource('markers', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: climbsJSON.features // Assuming you have climbsJSON defined elsewhere
        },
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 100 // Radius of each cluster when clustering points
    });

    map.loadImage('/Images/mapbox-icon.png', function(error, image) {
        if (error) throw error;
    map.addImage('custom-marker', image); // Add the image to the map
    })
});

function displayMarkers() {
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'markers',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });


    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'markers',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'symbol', // Change type to 'symbol'
        source: 'markers',
        filter: ['!', ['has', 'point_count']],
        layout: {
             'icon-image': 'custom-marker', // Use the added image as the marker
             'icon-size': 0.25, // Adjust the size of the icon if needed
             'icon-anchor': 'bottom' // Adjust the icon anchor if needed
        }
    });
        
    markersVisible = true;
}

// Click event on cluster layer
map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
    });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('markers').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
        });
    });
});

// Click event on unclustered layer
map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const climbname = e.features[0].properties.name;

    // Display popup
    new mapboxgl.Popup({ offset: 45 })
            .setLngLat(coordinates)
            .setHTML(`<h3>${climbname}</h3>`)
            .addTo(map);

    // Fly to the clicked point
    map.flyTo({
        center: coordinates,
        essential: true,
        duration: 500,
        complete: () => {
            // After flying animation is complete, enable clustering
            map.setLayoutProperty('clusters', 'visibility', 'visible');
            map.setLayoutProperty('cluster-count', 'visibility', 'visible');
        }
    });
});


// Function to remove markers
function removeMarkers() {
    map.removeLayer('clusters');
    map.removeLayer('cluster-count');
    map.removeLayer('unclustered-point');
    markersVisible = false;
}

// Event listener for radio buttons
document.querySelectorAll('input[name="drone"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'climbs') {
            displayMarkers();
        } else if (this.value === 'none') {
            removeMarkers();
        }
    });
});