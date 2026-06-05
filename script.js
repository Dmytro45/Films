// ==========================================================================
// 1. КОНСТАНТИ ТА КОНФІГУРАЦІЯ API
// ==========================================================================
const API_KEY = 'd7dda6ea6cbb5e025fa3e241f9316669'; 
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

const POPULAR_MOVIES_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=uk-UA&page=1`;
const SEARCH_API_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=uk-UA&query=`;
const GENRE_API_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=uk-UA&with_genres=`;
const ALL_GENRES_URL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=uk-UA`;

const HOME_PAGE_URL = POPULAR_MOVIES_URL; 

// Елементи інтерфейсу (DOM-вузли)
const filmsContainer = document.getElementById('filmsContainer');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const likesButton = document.getElementById('likes');
const logo = document.getElementById('logo');
const burgerButton = document.getElementById('burgerButton');
const dropdownMenu = document.getElementById('dropdownMenu');
const movieModal = document.getElementById('movieModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// Глобальний стан додатку
let showingFavorites = false; 

// ==========================================================================
// 2. КЕРУВАННЯ ЛОАДЕРОМ (LOADER)
// ==========================================================================
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
    
    const oldFilms = filmsContainer.querySelectorAll('.film');
    oldFilms.forEach(film => film.remove());
    
    const noResultsMsg = filmsContainer.querySelector('.no-results-msg');
    if (noResultsMsg) noResultsMsg.remove();
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

// ==========================================================================
// 3. ГОЛОВНІ ФУНКЦІЇ ЗАПИТІВ ТА РЕНДЕРУ ФІЛЬМІВ
// ==========================================================================
async function getMovies(url) {
    try {
        showLoader();
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.results || data.results.length === 0) {
            hideLoader();
            filmsContainer.innerHTML += '<p class="no-results-msg" style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px; margin-top: 50px;">Нічого не знайдено 😢</p>';
            return;
        }
        renderMovies(data.results);
    } catch (error) {
        hideLoader();
        console.error("Не вдалося завантажити фільми:", error);
    }
}

function renderMovies(movies) {
    hideLoader();
    const oldFilms = filmsContainer.querySelectorAll('.film');
    oldFilms.forEach(film => film.remove());

    const savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];

    movies.forEach(movie => {
        const filmCard = document.createElement('div');
        filmCard.classList.add('film'); 
        filmCard.style.cursor = 'pointer'; 

        const posterUrl = movie.poster_path ? (IMAGE_PATH + movie.poster_path) : 'https://via.placeholder.com/375x563?text=No+Poster';
        const isFav = savedItems.some(item => item.id === movie.id);
        
        const heartSvg = `
            <svg viewBox="0 0 24 24" fill="${isFav ? '#ff4a4a' : 'none'}" stroke="${isFav ? '#ff4a4a' : '#ffffff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        `;

        filmCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}" class="poster">
            <p>${movie.title}</p>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                ${heartSvg}
            </button>
        `;

        filmCard.addEventListener('click', () => openMovieModal(movie));

        const favBtn = filmCard.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(movie);
        });

        filmsContainer.appendChild(filmCard);
    });
}

// ==========================================================================
// 4. ЛОГІКА РОБОТИ З УЛЮБЛЕНИМИ (LOCALSTORAGE)
// ==========================================================================
function toggleFavorite(movie) {
    let savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];
    const index = savedItems.findIndex(item => item.id === movie.id);

    if (index === -1) {
        savedItems.push({ id: movie.id, title: movie.title, poster_path: movie.poster_path });
    } else {
        savedItems.splice(index, 1);
    }

    localStorage.setItem('myFavorites', JSON.stringify(savedItems));

    if (showingFavorites) {
        showFavorites();
    } else {
        const currentCards = document.querySelectorAll('.film');
        currentCards.forEach(card => {
            const btn = card.querySelector('.fav-btn');
            const id = parseInt(btn.getAttribute('data-id'));
            const isNowFav = savedItems.some(item => item.id === id);
            const svg = btn.querySelector('svg');
            if (isNowFav) {
                btn.classList.add('active');
                svg.setAttribute('fill', '#ff4a4a');
                svg.setAttribute('stroke', '#ff4a4a');
            } else {
                btn.classList.remove('active');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', '#ffffff');
            }
        });
    }
}

function showFavorites() {
    const savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];
    const oldFilms = filmsContainer.querySelectorAll('.film');
    oldFilms.forEach(film => film.remove());
    
    const noResultsMsg = filmsContainer.querySelector('.no-results-msg');
    if (noResultsMsg) noResultsMsg.remove();

    if (savedItems.length === 0) {
        filmsContainer.innerHTML += '<p class="no-results-msg" style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px; margin-top: 50px;">Ви ще не додали жодного фільму 🤍</p>';
        return;
    }
    renderMovies(savedItems);
}

// ==========================================================================
// 5. ЛОГІКА ПОШУКУ
// ==========================================================================
function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm && searchTerm !== '') {
        getMovies(SEARCH_API_URL + encodeURIComponent(searchTerm));
    } else {
        getMovies(HOME_PAGE_URL);
    }
}

if (searchButton) searchButton.addEventListener('click', performSearch);
if (searchInput) {
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') performSearch(); });
}

// ==========================================================================
// 6. ДИНАМІЧНЕ БУРГЕР-МЕНЮ ТА ЖАНРИ
// ==========================================================================
async function loadAllGenres() {
    try {
        const response = await fetch(ALL_GENRES_URL);
        const data = await response.json();
        if (data.genres && data.genres.length > 0) renderGenresMenu(data.genres);
    } catch (error) { 
        console.error("Помилка жанрів:", error); 
    }
}

function renderGenresMenu(genres) {
    const container = document.getElementById('allGenresContainer');
    if (!container) return;
    container.innerHTML = ''; 

    genres.forEach(genre => {
        const genreLink = document.createElement('a');
        genreLink.href = '#';
        genreLink.classList.add('genre-link'); 
        genreLink.setAttribute('data-genre', genre.id);
        genreLink.textContent = genre.name;

        genreLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetAppState();
            if (dropdownMenu) dropdownMenu.classList.remove('active');
            if (burgerButton) burgerButton.classList.remove('open');
            getMovies(GENRE_API_URL + genre.id);
        });
        container.appendChild(genreLink);
    });
}

document.querySelectorAll('#nav .genre-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        resetAppState();
        getMovies(GENRE_API_URL + e.target.getAttribute('data-genre'));
    });
});

if (burgerButton && dropdownMenu) {
    burgerButton.addEventListener('click', () => {
        burgerButton.classList.toggle('open');
        dropdownMenu.classList.toggle('active');
    });
}

// ==========================================================================
// 7. СЛУХАЧІ ІНТЕРФЕЙСУ ТА СКИДАННЯ СТАНУ
// ==========================================================================
function resetAppState() {
    showingFavorites = false;
    if (likesButton) {
        const pText = likesButton.querySelector('p');
        if (pText) pText.textContent = 'Вподобання ❤️';
    }
    if (searchInput) searchInput.value = '';
}

if (likesButton) {
    likesButton.addEventListener('click', () => {
        showingFavorites = !showingFavorites;
        if (showingFavorites) {
            likesButton.querySelector('p').textContent = 'Назад на головну 🏠';
            showFavorites();
        } else {
            likesButton.querySelector('p').textContent = 'Вподобання ❤️';
            getMovies(HOME_PAGE_URL);
        }
    });
}

if (logo) {
    logo.addEventListener('click', () => {
        resetAppState();
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        if (burgerButton) burgerButton.classList.remove('open');
        getMovies(HOME_PAGE_URL);
    });
}

// ==========================================================================
// 8. ЛОГІКА МОДАЛЬНОГО ВІКНО (ОПИС ФІЛЬМУ)
// ==========================================================================
function openMovieModal(movie) {
    if (!movieModal || !modalBody) return;

    const posterUrl = movie.poster_path ? (IMAGE_PATH + movie.poster_path) : 'https://via.placeholder.com/375x563?text=No+Poster';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'Немає';
    const overview = movie.overview ? movie.overview : 'Опис до цього фільму поки що відсутній українською мовою.';

    modalBody.innerHTML = `
        <div class="modal-flex">
            <img src="${posterUrl}" alt="${movie.title}" class="modal-poster">
            <div class="modal-info">
                <h2>${movie.title}</h2>
                <div class="modal-rating">Рейтинг TMDB: ⭐ ${rating}/10</div>
                <div class="modal-overview">
                    <h3>Опис фільму:</h3>
                    <p>${overview}</p>
                </div>
            </div>
        </div>
    `;
    movieModal.style.display = 'flex';
}

if (modalClose) {
    modalClose.addEventListener('click', () => { movieModal.style.display = 'none'; });
}

window.addEventListener('click', (e) => {
    if (e.target === movieModal) movieModal.style.display = 'none';
});

// ==========================================================================
// 9. СТАРТ ДОДАТКУ (INITIALIZATION)
// ==========================================================================
loadAllGenres();
getMovies(HOME_PAGE_URL);