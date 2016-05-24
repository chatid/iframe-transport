import IFT from '../build/IFT';

const iftInstance = new IFT('http://localhost:8081');

const state = { currentCount: 0 };

const currentCountEl = document.querySelector('.currentCount');
const button = document.getElementById('incr');

button.addEventListener('click', () => {
  state.currentCount++;
  localSync();
  iftInstance.broadcast(state);
}, false);

iftInstance.on('get', (data) => {
  if (data.doc && data.doc.currentCount) {
    state.currentCount = data.doc.currentCount;
    localSync();
  }
});

iftInstance.on('broadcast', (data) => {
  if (data && data.currentCount) {
    state.currentCount = data.currentCount;
    localSync();
  }
});

iftInstance.on('loaded', () => {
  iftInstance.get();
});


function localSync() {
  currentCountEl.innerHTML = state.currentCount;
}

localSync();
