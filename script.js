// ==========================================
// 1. КОНСТАНТИ ТА КОНФІГУРАЦІЯ API
// ==========================================
const API_KEY = 'd7dda6ea6cbb5e025fa3e241f9316669'; 
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

// Базові посилання
const POPULAR_MOVIES_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=uk-UA&page=1`;
const SEARCH_API_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=uk-UA&query=`;
const GENRE_API_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=uk-UA&with_genres=`;
const ALL_GENRES_URL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=uk-UA`;

// Константа головної сторінки (можна легко замінити на іншу за бажанням)
const HOME_PAGE_URL = POPULAR_MOVIES_URL; 

// Елементи з HTML
const filmsContainer = document.getElementById('films');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const likesButton = document.getElementById('likes');
const logo = document.getElementById('logo');
const burgerButton = document.getElementById('burgerButton');
const dropdownMenu = document.getElementById('dropdownMenu');

// Стан додатку
let showingFavorites = false; 

// ==========================================
// 2. ГОЛОВНІ ФУНКЦІЇ ЗАПИТІВ ТА РЕНДЕРУ ФІЛЬМІВ
// ==========================================

// Універсальна функція запиту до сервера
async function getMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            filmsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px; margin-top: 50px;">Нічого не знайдено 😢</p>';
            return;
        }

        renderMovies(data.results);
    } catch (error) {
        console.error("Не вдалося завантажити фільми:", error);
    }
}

// Функція динамічного створення карток на екрані
function renderMovies(movies) {
    filmsContainer.innerHTML = ''; 

    const savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];

    movies.forEach(movie => {
        const filmCard = document.createElement('div');
        filmCard.classList.add('film'); 
        filmCard.style.cursor = 'pointer'; // Робимо вказівник миші у вигляді пальчика

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

        // КЛІК НА КАРТКУ — ВІДКРИВАЄ ОПИС ФІЛЬМУ
        filmCard.addEventListener('click', () => {
            openMovieModal(movie);
        });

        // Клік по сердечку (завдяки e.stopPropagation() вікно з описом не відкриється)
        const favBtn = filmCard.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavorite(movie);
        });

        filmsContainer.appendChild(filmCard);
    });
}
// ==========================================
// 8. ЛОГІКА МОДАЛЬНОГО ВІКНА (ОПИС ФІЛЬМУ)
// ==========================================
const movieModal = document.getElementById('movieModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// Функція відкриття вікна та заповнення даними з API
function openMovieModal(movie) {
    if (!movieModal || !modalBody) return;

    const posterUrl = movie.poster_path ? (IMAGE_PATH + movie.poster_path) : 'https://via.placeholder.com/375x563?text=No+Poster';
    
    // Перевіряємо, чи є опис (інколи для старих/невідомих фільмів опис в базі порожній)
    const overviewText = movie.overview ? movie.overview : "На жаль, опис для цього фільму українською мовою поки що відсутній. 😔";
    
    // Округлюємо рейтинг до однієї цифри після коми (наприклад, 7.8)
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "Немає оцінки";
    // Отримуємо рік релізу
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Невідомо';

    // Формуємо красиву розмітку всередині вікна
    modalBody.innerHTML = `
        <div class="modal-flex">
            <img src="${posterUrl}" alt="${movie.title}" class="modal-poster">
            <div class="modal-info">
                <h2>${movie.title} (${releaseYear})</h2>
                <div class="modal-rating">⭐ Рейтинг TMDB: ${rating}/10</div>
                <div class="modal-overview">
                    <h3>Короткий опис:</h3>
                    <p>${overviewText}</p>
                </div>
            </div>
        </div>
    `;

    // Показуємо вікно за допомогою Flexbox
    movieModal.style.display = 'flex';
}

// Закриття вікна при кліку на хрестик
if (modalClose) {
    modalClose.addEventListener('click', () => {
        movieModal.style.display = 'none';
    });
}

// Закриття вікна при кліку на будь-яку зону екрану навколо вікна
window.addEventListener('click', (event) => {
    if (event.target === movieModal) {
        movieModal.style.display = 'none';
    }
});

// ==========================================
// 3. ЛОГІКА РОБОТИ З УЛЮБЛЕНИМИ (LOCALSTORAGE)
// ==========================================

function toggleFavorite(movie) {
    let savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];
    const index = savedItems.findIndex(item => item.id === movie.id);

    if (index === -1) {
        savedItems.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path
        });
    } else {
        savedItems.splice(index, 1);
    }

    localStorage.setItem('myFavorites', JSON.stringify(savedItems));

    if (showingFavorites) {
        showFavorites();
    } else {
        // Оновлюємо іконки на поточній сторінці без перезавантаження
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
    
    if (savedItems.length === 0) {
        filmsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px; margin-top: 50px;">Ви ще не додали жодного фільму в улюблені 🤍</p>';
        return;
    }
    
    renderMovies(savedItems);
}

// ==========================================
// 4. ЛОГІКА ПОШУКУ
// ==========================================
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
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') performSearch();
    });
}

// ==========================================
// 5. ДИНАМІЧНЕ БУРГЕР-МЕНЮ ТА НАВІГАЦІЯ ПО ЖАНРАХ
// ==========================================

// Завантаження ВСІХ жанрів з сервера
async function loadAllGenres() {
    try {
        const response = await fetch(ALL_GENRES_URL);
        if (!response.ok) throw new Error(`Статус: ${response.status}`);

        const data = await response.json();
        
        if (data.genres && data.genres.length > 0) {
            renderGenresMenu(data.genres);
        }
    } catch (error) {
        console.error("Не вдалося завантажити список жанрів:", error);
        const container = document.getElementById('allGenresContainer');
        if (container) container.innerHTML = `<p style="color: #ff4a4a; padding: 10px;">Помилка завантаження жанрів</p>`;
    }
}

// Рендер посилань у випадаюче меню
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

        genreLink.addEventListener('click', (event) => {
            event.preventDefault();
            resetAppState();

            // Автоматично закриваємо бургер після вибору жанру
            if (dropdownMenu) dropdownMenu.classList.remove('active');
            if (burgerButton) burgerButton.classList.remove('open');

            getMovies(GENRE_API_URL + genre.id);
        });

        container.appendChild(genreLink);
    });
}

// Обробка подій для статичних 4-х жанрів у шапці
document.querySelectorAll('#nav .genre-link').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        resetAppState();
        const genreId = event.target.getAttribute('data-genre');
        getMovies(GENRE_API_URL + genreId);
    });
});

// Перемикач кнопки бургер-меню (відкрити/закрити)
if (burgerButton && dropdownMenu) {
    burgerButton.addEventListener('click', () => {
        burgerButton.classList.toggle('open');
        dropdownMenu.classList.toggle('active');
    });
}

// ==========================================
// 6. СЛУХАЧІ ІНТЕРФЕЙСУ (КНОПКА ЛАЙКІВ ТА ЛОГО)
// ==========================================

// Допоміжна функція скидання інтерфейсу в базовий стан
function resetAppState() {
    showingFavorites = false;
    if (likesButton) {
        const pText = likesButton.querySelector('p');
        if (pText) pText.textContent = 'Вподобання ❤️';
    }
    if (searchInput) searchInput.value = '';
}

// Клік на кнопку "Вподобання"
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

// Клік на Логотип KinoCity — повне повернення "додому" без перезавантаження сторінки
if (logo) {
    logo.addEventListener('click', () => {
        resetAppState();
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        if (burgerButton) burgerButton.classList.remove('open');
        getMovies(HOME_PAGE_URL);
    });
}

// ==========================================
// 7. СТАРТ ДОДАТКУ ПРИ ЗАВАНТАЖЕННІ
// ==========================================
loadAllGenres();
getMovies(HOME_PAGE_URL);