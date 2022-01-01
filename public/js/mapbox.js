/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidGZ0LXRvbmkiLCJhIjoiY2t3cXM0eXQ5MHBlZTJ2cDM1YXZja3A2eiJ9.nWd0OWLkRGuu7xPWoJyKCQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/tft-toni/ckwqsvs5009m615nvrfxu0x0o',
    scrollZoom: false
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    //   interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // adaugam marcher pentru fiecare locatie
    const el = document.createElement('div');
    el.className = 'marker';

    // face un parcher specific
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // adaugam un pop-up
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>day: ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extinde limitele hartii ca sa includa locatiile
    bounds.extend(loc.coordinates);
  });
  // extind harta pentru a aparea pe ecran
  map.fitBounds(bounds, {
    padding: {
      top: 100,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
