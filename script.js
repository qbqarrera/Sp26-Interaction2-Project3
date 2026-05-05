const API_KEY = 'AIzaSyCl6wr9EWLSpAGvLZXzmsuXylCU23SysH4';

let player;
let currentIndex = 0;
let videoIds = [];
let videoTitles = [];
let timestampInterval = null;

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player('player', {
    height: '1',
    width: '1',
    events: {
      onStateChange: onPlayerStateChange
    }
  });
};


function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    changeTrack(1);
  }
  if (event.data === YT.PlayerState.PLAYING) {
    startTimestamp();
  }
}

async function searchSongs() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const resultsDiv = document.getElementById('results');

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=1&key=${API_KEY}`;
  //   CHANGE HERE TO CHANGE THE NUMBER OF SEARCH RESULTS

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      resultsDiv.innerHTML = `<p>API Error: ${data.error.message}</p>`;
      return;
    }

    if (!data.items || data.items.length === 0) {
      resultsDiv.innerHTML = '<p>no results found, try again</p>';
      return;
    }

    // auto plays first result
videoIds = data.items.map(item => item.id.videoId);
videoTitles = data.items.map(item => item.snippet.title);
playSong(0); 


  } catch (err) {
    resultsDiv.innerHTML = '<p>Error: could not connect. check your API key and internet connection</p>';
    console.error(err);
  }
}

function playSong(index) {
  currentIndex = index;
  player.loadVideoById(videoIds[currentIndex]);
  document.getElementById('now-playing').textContent = '' + videoTitles[currentIndex];
  document.getElementById('results').innerHTML = ''; // HIDES RESULTS AFTER CLICKING ON A SONG
const doodleButtons = document.querySelector('.doodle-buttons');
if (doodleButtons) doodleButtons.style.display = 'flex';
  startTimestamp();
}

function changeTrack(direction) {
  if (videoIds.length === 0) return;
  currentIndex = (currentIndex + direction + videoIds.length) % videoIds.length;
  playSong(currentIndex);
}

// use filterGallery on index.html, searchSongs on doodle.html
const galleryCheck = document.querySelector('.gallery');
if (galleryCheck) {
  document.getElementById('searchBtn').addEventListener('click', filterGallery);
  document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') filterGallery(); });
} else {
  document.getElementById('searchBtn').addEventListener('click', searchSongs);
  document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') searchSongs(); });
}



// time stamp here
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startTimestamp() {
  clearInterval(timestampInterval);
  timestampInterval = setInterval(() => {
    if (player && player.getCurrentTime) {
      const current = formatTime(player.getCurrentTime());
      const total = formatTime(player.getDuration());
      const el = document.getElementById('timestamp');
      if (el) el.textContent = `${current} / ${total}`;
    }
  }, 1000);
}



// doodle grid
const GRID_SIZE = 50;
const CELL_SIZE = 12;

let isMouseDown = false;
let paintMode = null; // true = fill, false = erase

document.addEventListener('mousedown', () => isMouseDown = true);
document.addEventListener('mouseup', () => { isMouseDown = false; paintMode = null; });

// added null check because otherwise JS crashes for index.html which doesn't have the doodle grid or clear button
const grid = document.getElementById('grid');
if (grid) {
  // Set grid layout using inline styles
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
  grid.style.width = 'fit-content';
  grid.style.border = '0.5px solid #4cbede';

  // Create cells
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const cell = document.createElement('div');
    cell.style.width = CELL_SIZE + 'px';
    cell.style.height = CELL_SIZE + 'px';
    cell.style.boxSizing = 'border-box';
    cell.style.border = '0.5px solid #4cbede';
    cell.style.backgroundColor = 'white';
    cell.dataset.filled = 'false';

    cell.addEventListener('mousedown', function () {
      // Determine paint mode based on first cell clicked
      paintMode = this.dataset.filled === 'false';
      toggle(this);
    });

    cell.addEventListener('mouseover', function () {
      // this HERE IS CURSOR STYLE
this.style.cursor = this.dataset.filled === 'false' ? 'pointer' : 'crosshair';
      if (isMouseDown && paintMode !== null) {
        if (paintMode && this.dataset.filled === 'false') toggle(this);
        if (!paintMode && this.dataset.filled === 'true') toggle(this);
      }
    });

    // Prevent drag selecting text
    cell.addEventListener('dragstart', e => e.preventDefault());
    grid.appendChild(cell);
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('#grid div').forEach(cell => {
        cell.style.backgroundColor = 'white';
        cell.dataset.filled = 'false';
      });
    });
  }
}

function toggle(cell) {
  if (cell.dataset.filled === 'false') {
    cell.style.backgroundColor = 'black';
    cell.dataset.filled = 'true';
  } else {
    cell.style.backgroundColor = 'white';
    cell.dataset.filled = 'false';
  }
}



// publish or discard

const publishBtn = document.getElementById('publishBtn');
const discardBtn = document.getElementById('discardBtn');

if (publishBtn) {
  publishBtn.addEventListener('click', () => {
    // save grid as array of filled cell indices
    const cells = document.querySelectorAll('#grid div');
    const filled = [];
    cells.forEach((cell, i) => {
      if (cell.dataset.filled === 'true') filled.push(i);
    });

    const drawing = {
      id: Date.now(),
      song: document.getElementById('now-playing').textContent,
      videoId: videoIds[currentIndex], // save videoId so clicking card can replay it
      filled: filled
    };

    const existing = JSON.parse(localStorage.getItem('drawings') || '[]');
    existing.push(drawing);
    localStorage.setItem('drawings', JSON.stringify(existing));

    alert('doodle published!');
    window.location.href = 'index.html';
  });
}

if (discardBtn) {
  discardBtn.addEventListener('click', () => {
    window.location.reload();
  });
}



// saved to gallery

function filterGallery() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
  const filtered = query ? drawings.filter(d => d.song.toLowerCase().includes(query)) : drawings;
  renderGallery(filtered);

  // auto play first match and scroll to it
  if (filtered.length > 0) {
    videoIds = [filtered[0].videoId];
    videoTitles = [filtered[0].song];
    playSong(0);
    setTimeout(() => {
      const firstCard = document.querySelector('.card');
      if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}

function renderGallery(drawings) {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  if (!drawings) drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
  if (drawings.length === 0) return;

  gallery.innerHTML = `
    <div id="gallery">
      ${drawings.map(d => `
        <div class="card" data-id="${d.id}">
          <p class="card-song">${d.song}</p>
          <canvas data-id="${d.id}" width="600" height="600"></canvas>
        </div>
      `).join('')}
    </div>
  `;

  drawings.forEach(d => {
    const canvas = document.querySelector(`canvas[data-id="${d.id}"]`);
    const ctx = canvas.getContext('2d');
    const size = 12;
    d.filled.forEach(i => {
      const x = (i % 50) * size;
      const y = Math.floor(i / 50) * size;
      ctx.fillRect(x, y, size, size);
    });
  });

  // click card to play song
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const drawing = drawings.find(d => d.id === id);
      if (!drawing) return;
      videoIds = [drawing.videoId];
      videoTitles = [drawing.song];
      playSong(0);
    });
  });

  // RIGHT CLICK TO DELETE
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const id = parseInt(card.querySelector('canvas').dataset.id);
      deleteDrawing(id);
    });
  });
}

function deleteDrawing(id) {
  if (prompt('enter password to delete') !== 'chashaobao') return;
  const drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
  const updated = drawings.filter(d => d.id !== id);
  localStorage.setItem('drawings', JSON.stringify(updated));
  renderGallery();
}

renderGallery();