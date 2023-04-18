'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map;
let mapEvent;

if (form) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      console.log(position);
      //const latitude = position.coords.latitude;
      //eller
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(latitude);
      console.log(longitude);
      console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

      const coords = [latitude, longitude];

      map = L.map('map').setView(coords, 13);
      //console.log(map);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //L.tileLayer(
        // 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
        // {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      //markör
      var marker = L.marker(coords).addTo(map);

      // stor rund cirlkel
      // var circle = L.circle(coords, {
      //   color: 'red',
      //   fillColor: '#f03',
      //   fillOpacity: 0.5,
      //   radius: 500,
      // }).addTo(map);

      //markering
      // var polygon = L.polygon([
      //   [51.509, -0.08],
      //   [51.503, -0.06],
      //   [51.51, -0.047],
      // ]).addTo(map);

      marker.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();
      //circle.bindPopup('I am a circle.');
      // polygon.bindPopup('I am a polygon.');

      // var popup = L.popup()
      //   .setLatLng([51.513, -0.09])
      //   .setContent('I am a standalone popup.')
      //   .openOn(map);

      var popup = L.popup();

      function onMapClick(e) {
        popup
          .setLatLng(e.latlng)
          .setContent('You clicked the map at ' + e.latlng.toString())
          .openOn(map);
      }

      // när man kliclar på kartan kan man
      map.on('click', onMapClick);

      // nhandle clicks on map
      function onMapClick(mapE) {
        mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
      }

      //map.on('click', onMapClick);
    },
    function () {
      console.log('Error');
    }
  );
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  // clear inputs
  inputDistance.value = '';
  inputDuration.value = '';
  inputCadence.value = '';
  inputElevation.value = '';

  console.log(mapEvent);
  const { lat, lng } = mapEvent.latlng;
  //L.marker(mapEvent.latlng)
  L.marker([lat, lng])
    .addTo(map)
    //.bindPopup('You clicked the map at' + e.latlng)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        // autoPan: false,
        // closeButton: false,
        className: 'running-popup',
        closeOnClick: false,
      })
    )
    .setPopupContent('You clicked the map at' + mapEvent.latlng)
    .openPopup();
});
