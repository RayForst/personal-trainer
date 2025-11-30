# Инструкция по развертыванию на VPS (без Docker)

> **Примечание:** Инструкция проверена для Ubuntu 24.04 LTS (Noble Numbat). Все команды должны работать корректно.

## Подготовка на VPS

1. **Установите Node.js (версия 20+ или 22+):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Проверьте версию:
```bash
node --version  # должна быть 20.x или выше
npm --version
```

2. **Установите pnpm:**
```bash
npm install -g pnpm
```

3. **Установите MongoDB:**
```bash
# MongoDB для Ubuntu 24.04 использует репозиторий jammy (22.04) - это нормально
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

Проверьте статус:
```bash
sudo systemctl status mongod
```

4. **Установите Nginx и Certbot:**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

5. **Установите PM2 (менеджер процессов):**
```bash
npm install -g pm2
```

## Развертывание приложения

6. **Клонируйте проект:**
```bash
git clone <ваш-репозиторий> /opt/personal-trainer
cd /opt/personal-trainer
```

7. **Установите зависимости:**
```bash
pnpm install
```

8. **Создайте `.env` файл:**
```bash
nano .env
```

Добавьте следующие переменные:
```env
DATABASE_URI=mongodb://localhost:27017/personal-trainer
PAYLOAD_SECRET=<сгенерируйте-секретный-ключ>
NODE_ENV=production
PORT=3000
AUTH_USERNAME=<ваш-логин>
AUTH_PASSWORD=<ваш-пароль>
```

Для генерации `PAYLOAD_SECRET`:
```bash
openssl rand -base64 32
```

9. **Создайте папку для логов:**
```bash
mkdir -p logs
```

10. **Соберите проект:**
```bash
pnpm build
```

11. **Запустите через PM2:**

Файл `ecosystem.config.cjs` уже включен в проект. Просто запустите:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Выполните команду, которую покажет pm2 startup (для автозапуска при перезагрузке сервера)
```

Проверьте статус:
```bash
pm2 status
pm2 logs personal-trainer
```

## Настройка Nginx

12. **Создайте конфигурацию Nginx `/etc/nginx/sites-available/trainer.scape-dev.com`:**
```bash
sudo nano /etc/nginx/sites-available/trainer.scape-dev.com
```

Добавьте:
```nginx
server {
    listen 80;
    server_name trainer.scape-dev.com;

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

13. **Активируйте конфигурацию:**
```bash
sudo ln -s /etc/nginx/sites-available/trainer.scape-dev.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL сертификат

14. **Получите SSL сертификат:**
```bash
sudo certbot --nginx -d trainer.scape-dev.com
```

## Полезные команды

- **Просмотр логов PM2:** `pm2 logs personal-trainer`
- **Перезапуск:** `pm2 restart personal-trainer`
- **Остановка:** `pm2 stop personal-trainer`
- **Статус:** `pm2 status`
- **Обновление приложения:**
  ```bash
  cd /opt/personal-trainer
  git pull
  pnpm install
  pnpm build
  pm2 restart personal-trainer
  ```
- **Просмотр логов в реальном времени:** `pm2 logs personal-trainer --lines 100`
- **Мониторинг:** `pm2 monit`
- **Бэкап MongoDB:**
  ```bash
  mongodump --out /opt/backups/mongo-$(date +%Y%m%d)
  ```
- **Восстановление из бэкапа:**
  ```bash
  mongorestore /opt/backups/mongo-YYYYMMDD
  ```

## Настройка DNS

Убедитесь, что DNS запись для `trainer.scape-dev.com` указывает на IP вашего VPS:
```
A    trainer.scape-dev.com    <IP-вашего-VPS>
```

## Проверка работы

После настройки проверьте:
- Приложение доступно: `curl http://localhost:3000`
- PM2 процесс запущен: `pm2 status`
- MongoDB работает: `sudo systemctl status mongod`
- Nginx работает: `sudo systemctl status nginx`

