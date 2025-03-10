'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat , lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setdescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }  ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcpace();
    this._setdescription();
  }

  calcpace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationgain) {
    super(coords, distance, duration);
    this.elevationgain = elevationgain;
    this.calcspeed();
    this._setdescription();
  }
  calcspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new running([39, -12], 5.2, 24, 178);
// const cycling1 = new cycling([39, -12], 27, 95, 523);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// architecture
class App {
  #map;
  #mapzoomlvl = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //get users position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //attack event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get your position');
        }
      );
  }

  _loadMap(position) {
    //   console.log(position);
    // const latitude = position.coords.latitude;
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(
    //   `https://www.google.com/maps/@${latitude},${longitude},13.33z?entry=ttu`
    // );

    const coords = [latitude, longitude];

    //   console.log(latitude, longitude);
    this.#map = L.map('map').setView(coords, this.#mapzoomlvl);
    // console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderworkoutmarker(work);
    });
  }

  _showForm(mapE) {
    this.mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideform() {
    inputDistance.value =
      inputDistance.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validinputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allpositives = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.mapEvent.latlng;
    let workout;

    //if activity running,create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        !validinputs(distance, duration, cadence) ||
        !allpositives(distance, duration, cadence)
      )
        return alert('input have to be positive numbers!');

      workout = new running([lat, lng], distance, duration, cadence);
    }
    //if activity cycling,create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        !validinputs(distance, duration, elevation) ||
        !allpositives(distance, duration, elevation)
      )
        return alert('input have to be positive numbers!');
      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderworkoutmarker(workout);

    //render workout on list
    this._renderworkout(workout);

    //hide form + clear input fields
    this._hideform();
    //display marker
    // console.log(this.mapEvent);
    // const { lat, lng } = this.mapEvent.latlng;

    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderworkoutmarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }
  _renderworkout(workout) {
    let html = ` 
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    if (workout.type === 'cycling')
      html += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationgain}</span>
    <span class="workout__unit">m</span>
  </div>
  </li>
  `;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapzoomlvl, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using the public interface
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderworkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// app._getPosition();
