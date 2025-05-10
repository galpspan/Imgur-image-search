// Получаем элементы из DOM
const button = document.getElementById('get-image');
const stringLength = document.getElementById('stringlength');
const numImages = document.getElementById('numimages');
const imagesDiv = document.getElementById('images');
const timer = document.getElementById('timer');

let intervalId; // ID интервала для таймера
let analyzedImageCount = 0; // Количество найденных изображений

// Запускает таймер и обновляет отображение каждую сотую секунды
function startTimer() {
  let startTime = Date.now();
  intervalId = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    const milliseconds = Math.floor((elapsedTime % 1000) / 10);
    timer.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  }, 10);
}

// Останавливает таймер
function stopTimer() {
  clearInterval(intervalId);
}

// Генерирует случайную строку заданной длины
function generateRandomString(length) {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

// Загружает изображение по URL и возвращает его размеры
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = function() {
      resolve({ width: this.width, height: this.height, url: url });
    };
    image.onerror = function() {
      reject(new Error('Не удалось загрузить изображение.'));
    };
    image.src = url;
  });
}

// Пытается получить изображение с Imgur по случайной строке
async function fetchImage(randomString) {
  try {
    const response = await fetch(`https://i.imgur.com/${randomString}.jpg`);
    const contentType = response.headers.get('content-type');
    let fileFormat;

    // Определяем формат файла по заголовку content-type
    if (contentType.includes('jpeg')) {
      fileFormat = 'jpg';
    } else if (contentType.includes('png')) {
      fileFormat = 'png';
    } else if (contentType.includes('gif')) {
      fileFormat = 'gif';
    } else {
      throw new Error('Неподдерживаемый формат');
    }

    const source = `https://i.imgur.com/${randomString}.${fileFormat}`;
    const imageInfo = await loadImage(source);

    // Пропускаем изображения-заглушки
    if (imageInfo.width === 161 && imageInfo.height === 81) {
      throw new Error('Заглушка');
    }

    return source;
  } catch (error) {
    throw error;
  }
}

// Основная функция получения случайных изображений
async function getRandomImages() {
  const length = parseInt(stringLength.value, 10); // Длина строки
  const num = parseInt(numImages.value, 10);       // Сколько изображений нужно
  const batchSize = 10; // Сколько одновременно пробуем загрузить (можно изменить, но увеличение числа может привести к блокировке на имгуре, поиск картинок будет производится, но доступ к сайту заблокируется)
  let found = 0;
  let skipped = 0;

  startTimer(); // Запускаем таймер

  // Пока не найдём нужное количество изображений
  while (found < num) {
    // Генерируем массив случайных строк
    const batch = Array.from({ length: batchSize }, () => generateRandomString(length));
    // Пытаемся загрузить изображения, ошибки обрабатываются и возвращают null
    const promises = batch.map(str => fetchImage(str).catch(() => null));
    const results = await Promise.all(promises);

    for (const result of results) {
      if (result && found < num) {
        analyzedImageCount++;

        const img = new Image();
        img.src = result;
        img.width = 400;

        // Обёртка для изображения
        const imageWrapper = document.createElement('div');
        imageWrapper.style.position = 'relative';
        imageWrapper.appendChild(img);

        // Ссылка на изображение
        const linkElement = document.createElement('a');
        linkElement.className = 'link-element';
        linkElement.href = result;
        linkElement.target = "_blank";
        linkElement.textContent = result;

        // Время загрузки
        const timeElement = document.createElement('span');
        timeElement.className = 'time-element';
        timeElement.textContent = ' ' + new Date().toLocaleTimeString();

        // Контейнер для ссылки и времени
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        linkContainer.appendChild(linkElement);
        linkContainer.appendChild(timeElement);

        // Полный блок с изображением и ссылкой
        const fullContainer = document.createElement('div');
        fullContainer.style.margin = '20px auto';
        fullContainer.style.textAlign = 'center';
        fullContainer.appendChild(imageWrapper);
        fullContainer.appendChild(linkContainer);

        // Добавляем блок в DOM
        imagesDiv.appendChild(fullContainer);
        found++;
      } else {
        skipped++;
      }
    }

    updateImageCount(skipped); // Обновляем счётчики
  }

  stopTimer(); // Останавливаем таймер
  button.disabled = false;
  button.value = 'Получить изображение';

  if (found === num) {
    document.getElementById('done-block').style.display = 'block'; // Показываем блок завершения
  }
}

// Обновляет счётчик изображений
function updateImageCount(skipped = 0) {
  const imageCountElement = document.getElementById('image-count');
  imageCountElement.innerHTML = `Изображений найдено: ${analyzedImageCount}<br>Пропущено: ${skipped}`;
}

// Обработчик нажатия кнопки
button.addEventListener('click', () => {
  button.disabled = true;
  button.value = 'Ищу...';

  analyzedImageCount = 0;
  const imageCountElement = document.getElementById('image-count');
  imageCountElement.innerHTML = 'Изображений найдено: 0';

  imagesDiv.innerHTML = '';
  timer.innerHTML = '';
  document.getElementById('done-block').style.display = 'none';

  getRandomImages(); // Запускаем загрузку изображений
});

// Кнопка прокрутки вверх
var scrollToTopBtn = document.getElementById("scrollToTopBtn");
var rootElement = document.documentElement;

// Плавная прокрутка к верху страницы
function scrollToTop() {
  rootElement.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
scrollToTopBtn.addEventListener("click", scrollToTop);
