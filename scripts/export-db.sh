#!/bin/bash

# Скрипт для экспорта MongoDB базы данных (локальный MongoDB)
# Использование: ./scripts/export-db.sh [имя_базы] [хост] [порт] [путь_для_экспорта]

set -e

# Проверяем наличие mongodump
if ! command -v mongodump &> /dev/null; then
    echo "❌ Ошибка: mongodump не найден. Установите MongoDB Tools:"
    echo "   macOS: brew install mongodb/brew/mongodb-database-tools"
    echo "   или скачайте с https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Параметры подключения
DB_NAME=${1:-"personal-trainer"}
MONGO_HOST=${2:-"localhost"}
MONGO_PORT=${3:-"27017"}

# Путь для экспорта (по умолчанию: ./backups)
EXPORT_DIR=${4:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_PATH="${EXPORT_DIR}/${DB_NAME}_${TIMESTAMP}"

# Создаем директорию для бэкапов, если её нет
mkdir -p "$EXPORT_DIR"

echo "📦 Экспорт базы данных '${DB_NAME}'..."
echo "🔌 Подключение: ${MONGO_HOST}:${MONGO_PORT}"
echo "📁 Путь экспорта: ${EXPORT_PATH}"

# Выполняем mongodump
mongodump \
    --host="${MONGO_HOST}:${MONGO_PORT}" \
    --db="$DB_NAME" \
    --out="$EXPORT_PATH" \
    --quiet

# Создаем архив
if command -v tar &> /dev/null; then
    echo "📦 Создание архива..."
    cd "$EXPORT_DIR"
    tar -czf "${DB_NAME}_${TIMESTAMP}.tar.gz" "${DB_NAME}_${TIMESTAMP}"
    rm -rf "${DB_NAME}_${TIMESTAMP}"
    echo "✅ Экспорт завершен: ${EXPORT_DIR}/${DB_NAME}_${TIMESTAMP}.tar.gz"
else
    echo "✅ Экспорт завершен: ${EXPORT_PATH}"
fi

echo "🎉 Готово!"

