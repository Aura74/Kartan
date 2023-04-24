'use strict';

// workoutclass
class Workout {
  date = new Date();
  //id = Math.floor(Math.random() * 100000000
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    //this.date =
    //this.id =
    this.coords = coords; // [lat, lng]
    this.distance = distance; // kn
    this.duration = duration; // min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.typ[0].toUpperCase()}${this.typ.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

//child class
class Running extends Workout {
  typ = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    //this.calcPace = this.calcPace.bind(this);// ai förslag
    this.calcPace(); // kallar här
    this._setDescription();
  }

  calcPace() {
    // min / km
    this.pace = this.duration / this.distance;
    return this.pace; // behövs egentligen inte när man kallar på den uppe
  }
}

class Cycling extends Workout {
  typ = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1);
// console.log(cycling1);

///////////////////////////////////////////////////////////////
//Aplication Architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Klasser här
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // hämta användar position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Geolocation is not supported by this browser.');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //L.tileLayer(
      // 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
      // {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);

    // när man kliclar på kartan kan man
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));

    // handle clicks on map
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //emty inputs

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    // closest väljer föräldrar inte barn, man måste ha med .
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // helper function 1
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    // helper function 2 om nr är större än 0
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    // get data vrån form
    const type = inputType.value;
    const distance = +inputDistance.value; // + gör att det blir ett numer konvertear till nummer
    const duration = +inputDuration.value; // + gör att det blir ett numer konvertear till nummer
    const { lat, lng } = this.#mapEvent.latlng;
    let workout; // så det blir åtkomligt utanför scopet

    // if workout is running, then create running object
    if (type === 'running') {
      const cadence = +inputCadence.value; // + gör att det blir ett numer

      //Check if data is valid
      if (
        // !Number.isFinite(distance) || // or
        // !Number.isFinite(duration) || // or
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Please enter a valid distance Positive Number.');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout is cucling, then create cicling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value; // + gör att det blir ett numer

      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Please enter a valid distance Positive Number.');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // push, add new object to workouts array
    this.#workouts.push(workout);

    // render on map as marker     //display marker
    //L.marker(mapEvent.latlng)
    this._renderWorkoutMarker(workout);

    // Render workouts on list
    this._renderWorkout(workout);

    // Hide form + clear inputs
    this._hideForm();
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      //.bindPopup('You clicked the map at' + e.latlng)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          // autoPan: false,
          // closeButton: false,
          className: `${workout.type}-popup`, //  här är felet
          //closeOnClick: false,
        })
      )
      .setPopupContent(
        `${workout.typ === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  // ${workout}
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.typ}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.typ === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.typ === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `;

    if (workout.typ === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //console.log(workout);

    // kolla dok på denna
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    //workout.click();
  }

  _setLocalStorage() {
    // är en key value    workout är key    stringify konverterar objekt till en sträng, i detta fall this.#workouts till sträng
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
