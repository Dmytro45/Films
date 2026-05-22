const API_KEY = 'd7dda6ea6cbb5e025fa3e241f9316669'; 
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

// Базові посилання
const POPULAR_MOVIES_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=uk-UA&page=1`;
const SEARCH_API_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=uk-UA&query=`;

// Твої елементи з HTML
const filmsContainer = document.getElementById('films');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// 1. Функція запиту до сервера (універсальна)
async function getMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Якщо нічого не знайдено, можна вивести повідомлення
        if (data.results.length === 0) {
            filmsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px;">Нічого не знайдено 😢</p>';
            return;
        }

        renderMovies(data.results);
    } catch (error) {
        console.error("Не вдалося завантажити фільми:", error);
    }
}

// 2. Функція автоматичного створення карток (твої стилі)
function renderMovies(movies) {
    filmsContainer.innerHTML = ''; // Очищуємо старі фільми

    movies.forEach(movie => {
        const filmCard = document.createElement('div');
        filmCard.classList.add('film'); 

        const posterUrl = movie.poster_path ? (IMAGE_PATH + movie.poster_path) : 'https://via.placeholder.com/375x563?text=No+Poster';

        filmCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}" class="poster">
            <p>${movie.title}</p>
        `;

        filmsContainer.appendChild(filmCard);
    });
}

// 3. ЛОГІКА ПОШУКУ

// Функція, яка запускає пошук
function performSearch() {
    const searchTerm = searchInput.value.trim();

    if (searchTerm && searchTerm !== '') {
        // Якщо в інпуті є текст — шукаємо його через SEARCH_API
        getMovies(SEARCH_API_URL + encodeURIComponent(searchTerm));
    } else {
        // Якщо інпут порожній і натиснули "Шукати" — повертаємо популярні фільми
        getMovies(POPULAR_MOVIES_URL);
    }
}

// Слухач на клік по кнопці "Шукати"
if (searchButton) {
    searchButton.addEventListener('click', performSearch);
}

// Слухач на натискання клавіші Enter в інпуті (щоб не тільки мишкою клікати)
if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
}

function renderMovies(movies) {
    filmsContainer.innerHTML = ''; 

    // Завантажуємо список улюблених, щоб знати, які серця малювати зафарбованими
    const savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];

    movies.forEach(movie => {
        const filmCard = document.createElement('div');
        filmCard.classList.add('film'); 

        const posterUrl = movie.poster_path ? (IMAGE_PATH + movie.poster_path) : 'https://via.placeholder.com/375x563?text=No+Poster';

        // Перевіряємо, чи фільм уже в улюблених
        const isFav = savedItems.some(item => item.id === movie.id);
        const heartIcon = isFav ? '❤️' : '🤍';

        // Додаємо кнопку сердечка прямо в HTML картки
        filmCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}" class="poster">
            <p>${movie.title}</p>
            <button class="fav-btn" data-id="${movie.id}" style="background: transparent; border: none; font-size: 30px; cursor: pointer; margin-bottom: 15px;">
                ${heartIcon}
            </button>
        `;

        // Вішаємо подію кліку на сердечко всередині цієї картки
        const favBtn = filmCard.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // щоб клік не спрацьовував на всю картку
            toggleFavorite(movie);
        });

        filmsContainer.appendChild(filmCard);
    });
}


function toggleFavorite(movie) {
    let savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];
    
    // Перевіряємо, чи є вже такий фільм за його унікальним ID від API
    const index = savedItems.findIndex(item => item.id === movie.id);

    if (index === -1) {
        // Якщо немає — додаємо об'єкт фільму (зберігаємо ID, назву та постер)
        savedItems.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path
        });
    } else {
        // Якщо є — видаляємо його з масиву
        savedItems.splice(index, 1);
    }

    // Зберігаємо оновлений список в пам'ять браузера
    localStorage.setItem('myFavorites', JSON.stringify(savedItems));

    // Оновлюємо зовнішній вигляд карток на екрані
    // Перевіряємо, що зараз показується: якщо ми в розділі "Вподобання" — перемальовуємо улюблені, інакше — поточний пошук/популярні
    if (showingFavorites) {
        showFavorites();
    } else {
        // Просто перемальовуємо поточні картки, щоб змінити колір сердечка
        const currentCards = document.querySelectorAll('.film');
        currentCards.forEach(card => {
            const btn = card.querySelector('.fav-btn');
            const id = parseInt(btn.getAttribute('data-id'));
            const isNowFav = savedItems.some(item => item.id === id);
            btn.textContent = isNowFav ? '❤️' : '🤍';
        });
    }
}



const likesButton = document.getElementById('likes');
let showingFavorites = false; // Змінна-прапорець: чи дивиться користувач зараз улюблені

function showFavorites() {
    const savedItems = JSON.parse(localStorage.getItem('myFavorites')) || [];
    
    if (savedItems.length === 0) {
        filmsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: rgba(255,255,255,0.6); font-size: 24px; margin-top: 50px;">Ви ще не додали жодного фільму в улюблені 🤍</p>';
        return;
    }
    
    // Використовуємо нашу ж функцію для малювання, адже структура об'єктів однакова!
    renderMovies(savedItems);
}

if (likesButton) {
    likesButton.addEventListener('click', () => {
        showingFavorites = !showingFavorites; // змінюємо стан (true/false)

        if (showingFavorites) {
            // Міняємо текст кнопки або її стилі, щоб користувач бачив, що він в "улюбленому"
            likesButton.querySelector('p').textContent = 'Назад на головну 🏠';
            showFavorites();
        } else {
            likesButton.querySelector('p').textContent = 'Вподобання ❤️';
            // Повертаємо популярні фільми
            getMovies(POPULAR_MOVIES_URL);
        }
    });
}

// При першому завантаженні сторінки показуємо популярні фільми
getMovies(POPULAR_MOVIES_URL);