# Быстрый запуск через PM2

## Шаги для запуска на VPS

### 1. Подготовка окружения
```bash
# Установите Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите pnpm
npm install -g pnpm

# Установите PM2
npm install -g pm2
```

### 2. Развертывание приложения
```bash
# Клонируйте проект (или загрузите файлы)
cd /opt/personal-trainer  # или ваш путь

# Установите зависимости
pnpm install

# Создайте .env файл с необходимыми переменными
nano .env
```

Минимальный `.env`:
```env
DATABASE_URI=mongodb://localhost:27017/personal-trainer
PAYLOAD_SECRET=<сгенерируйте через: openssl rand -base64 32>
NODE_ENV=production
PORT=3000
AUTH_USERNAME=<ваш-логин>
AUTH_PASSWORD=<ваш-пароль>
```

### 3. Сборка и запуск
```bash
# Создайте папку для логов
mkdir -p logs

# Соберите проект
pnpm build

# Запустите через PM2
pm2 start ecosystem.config.js

# Сохраните конфигурацию PM2
pm2 save

# Настройте автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую покажет pm2 startup
```

### 4. Проверка
```bash
# Проверьте статус
pm2 status

# Просмотрите логи
pm2 logs personal-trainer

# Проверьте доступность приложения
curl http://localhost:3000
```

## Полезные команды PM2

```bash
# Просмотр логов
pm2 logs personal-trainer
pm2 logs personal-trainer --lines 100  # последние 100 строк

# Управление процессом
pm2 restart personal-trainer
pm2 stop personal-trainer
pm2 start personal-trainer
pm2 delete personal-trainer

# Мониторинг
pm2 monit
pm2 status

# Перезагрузка после обновления кода
cd /opt/personal-trainer
git pull
pnpm install
pnpm build
pm2 restart personal-trainer
```

## Настройка Nginx (опционально)

Если нужно настроить Nginx как reverse proxy:

```bash
sudo nano /etc/nginx/sites-available/personal-trainer
```

Добавьте:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/personal-trainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Решение проблем

### Приложение не запускается
1. Проверьте логи: `pm2 logs personal-trainer`
2. Убедитесь, что MongoDB запущен: `sudo systemctl status mongod`
3. Проверьте .env файл и переменные окружения
4. Убедитесь, что порт 3000 свободен: `sudo lsof -i :3000`

### Ошибки при сборке
1. Убедитесь, что Node.js версии 20+: `node --version`
2. Очистите кэш: `rm -rf .next node_modules && pnpm install`
3. Проверьте доступную память: `free -h`

### PM2 не сохраняет процессы после перезагрузки
Выполните команду из вывода `pm2 startup` с sudo

