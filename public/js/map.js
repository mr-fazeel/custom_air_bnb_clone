// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if mapboxgl is available
    if (typeof mapboxgl === 'undefined') {
        console.error('Mapbox GL JS is not loaded');
        return;
    }

    // Check if we have a valid token
    if (!mapToken) {
        console.error('Mapbox token is not available');
        return;
    }

    mapboxgl.accessToken = mapToken;

    // Check if listing and coordinates exist
    if (listing && listing.geometry && listing.geometry.coordinates) {
        // Check if map container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        try {
            const map = new mapboxgl.Map({
                container: 'map',
                style: "mapbox://styles/mapbox/streets-v12",
                center: listing.geometry.coordinates,
                zoom: 9
            });

            // Add navigation controls
            map.addControl(new mapboxgl.NavigationControl());

            const marker = new mapboxgl.Marker({ color: 'red' })
                .setLngLat(listing.geometry.coordinates)
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 }).setHTML(
                        `<h4>${listing.title}</h4> <p>Exact location will be provided after booking</p>`
                    )
                )
                .addTo(map);

            // Custom pointer style for the map
            map.getCanvas().style.cursor = 'pointer';
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    } else {
        console.error('Listing coordinates not found:', listing);
    }
});
