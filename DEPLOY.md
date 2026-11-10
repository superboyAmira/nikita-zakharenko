# Сборка, публикация и подключение домена

Проект собирается в Cloudflare Worker (Vinext + Vite). Ниже путь от архива до сайта на своём домене.

> Сборка и деплой в этой инструкции не прогонялись в среде, где готовился архив: там не было доступа к npm. Команды взяты из `package.json` проекта и документации Cloudflare. Если шаг ведёт себя иначе, смотрите раздел «Если что-то пошло не так».

## 1. Что нужно

- Node.js 22.13.0 или новее и npm.
- Аккаунт Cloudflare (бесплатного тарифа достаточно).
- Домен. Он должен быть добавлен в Cloudflare как зона, то есть его NS-записи указывают на Cloudflare.

## 2. Локальный запуск

```sh
npm run install:ci   # установка зависимостей
npm run dev          # http://127.0.0.1:5173/
```

## 3. Проверка и сборка

```sh
npx tsc --noEmit     # типы
npm run lint         # ESLint
npm run build        # результат в dist/
npm start            # локальный запуск собранного Worker
```

После `npm run build` появляется `dist/server/wrangler.json`. Это готовая конфигурация Worker, её использует и `npm start`, и деплой.

## 4. Публикация в Cloudflare

```sh
npx wrangler login
npx wrangler deploy --config dist/server/wrangler.json
```

Wrangler напечатает адрес вида `https://<имя>.<аккаунт>.workers.dev`. Откройте его и проверьте все четыре экрана, переключение языка и скачивание CV.

Обновление сайта: снова `npm run build`, затем та же команда `wrangler deploy`.

## 5. Подключение домена

### Вариант А. Через панель Cloudflare (проще)

1. Добавьте домен в Cloudflare: **Add a domain**, затем у регистратора замените NS-записи на те, что покажет Cloudflare. Дождитесь статуса **Active**.
2. Откройте **Workers & Pages**, выберите опубликованный Worker.
3. **Settings → Domains & Routes → Add → Custom Domain**.
4. Введите домен, например `zakharenko.dev` или `cv.zakharenko.dev`, и подтвердите.

DNS-запись и сертификат Cloudflare создаст сам. Вручную добавлять A/CNAME не нужно. Если на этом имени уже есть запись, сначала удалите её в разделе DNS.

Чтобы работали и `example.com`, и `www.example.com`, добавьте оба имени как Custom Domain.

### Вариант Б. Через конфигурацию

`dist/server/wrangler.json` пересоздаётся при каждой сборке, поэтому домен удобнее задавать в панели (вариант А). Если нужен деплой одной командой, передайте домен флагом:

```sh
npx wrangler deploy --config dist/server/wrangler.json --domains cv.example.com
```

В собственном файле Wrangler то же самое записывается так:

```jsonc
{
  "routes": [
    { "pattern": "cv.example.com", "custom_domain": true }
  ]
}
```

### Домен у другого регистратора без переноса NS

Custom Domain работает только для зон в Cloudflare. Переносить сам домен не нужно, достаточно сменить NS-серверы у регистратора на Cloudflare. Регистрация и оплата домена остаются там же.

## 6. После подключения

- Откройте `https://ваш-домен/` и `https://ваш-домен/#contact`.
- В `app/layout.tsx` при желании добавьте `metadataBase: new URL("https://ваш-домен")` в `metadata`, чтобы ссылки Open Graph были абсолютными.
- Адрес `*.workers.dev` можно отключить: Worker → **Settings → Domains & Routes** → выключить `workers.dev`.

## Если что-то пошло не так

| Симптом | Что проверить |
| --- | --- |
| `npm run install:ci` падает | Версию Node (`node -v` ≥ 22.13.0) и доступ к registry.npmjs.org |
| `wrangler deploy` не находит конфигурацию | Сначала выполните `npm run build`; файл лежит в `dist/server/wrangler.json` |
| Wrangler просит `account_id` | Выполните `npx wrangler whoami`; при нескольких аккаунтах задайте `CLOUDFLARE_ACCOUNT_ID` |
| Домен не добавляется как Custom Domain | Зона должна быть **Active**, а на этом имени не должно быть существующей DNS-записи |
| Вместо 3D-модели фиолетовая фигура | Это запасной вид без WebGL. Проверьте аппаратное ускорение в браузере |
| Шрифты не подгружаются | Сайт берёт их с fonts.googleapis.com; при блокировке сработают системные |

## Где что лежит

- `app/page.tsx`: тексты EN/RU, навигация, разметка экранов.
- `app/scene.ts`: 3D-модели, материалы, свет, переходы.
- `app/blob.tsx`, `app/three-loader.ts`: подключение сцены к React и ленивая загрузка Three.js.
- `app/globals.css`: цвета, шрифты, адаптивная вёрстка.
- `app/layout.tsx`: заголовок, метаданные, подключение шрифтов.
- `public/Nikita-Zakharenko-CV.pdf`: скачиваемое резюме.
