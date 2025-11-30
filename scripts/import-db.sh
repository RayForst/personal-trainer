#!/bin/bash

# Скрипт для импорта MongoDB базы данных (локальный MongoDB)
# Использование: ./scripts/import-db.sh [путь_к_архиву_или_директории] [имя_базы] [хост] [порт]

set -e

# Проверяем наличие mongorestore
if ! command -v mongorestore &> /dev/null; then
    echo "❌ Ошибка: mongorestore не найден. Установите MongoDB Tools:"
    echo "   macOS: brew install mongodb/brew/mongodb-database-tools"
    echo "   или скачайте с https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Проверяем наличие аргумента с путем
if [ -z "$1" ]; then
    echo "❌ Ошибка: Укажите путь к архиву или директории с экспортом"
    echo "Использование: ./scripts/import-db.sh [путь] [имя_базы] [хост] [порт]"
    echo ""
    echo "Примеры:"
    echo "  ./scripts/import-db.sh ./backups/personal-trainer_20240101_120000.tar.gz"
    echo "  ./scripts/import-db.sh ./backups/personal-trainer_20240101_120000"
    exit 1
fi

IMPORT_SOURCE="$1"
DB_NAME=${2:-"personal-trainer"}
MONGO_HOST=${3:-"localhost"}
MONGO_PORT=${4:-"27017"}

# Создаем временную директорию для распаковки архива
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Проверяем, является ли источник архивом или директорией
if [ -f "$IMPORT_SOURCE" ] && [[ "$IMPORT_SOURCE" == *.tar.gz ]] || [[ "$IMPORT_SOURCE" == *.tgz ]]; then
    echo "📦 Распаковка архива..."
    tar -xzf "$IMPORT_SOURCE" -C "$TEMP_DIR"
    # Находим директорию с данными (обычно это первая поддиректория)
    RESTORE_PATH=$(find "$TEMP_DIR" -type d -mindepth 1 -maxdepth 1 | head -n 1)
elif [ -d "$IMPORT_SOURCE" ]; then
    # Если это директория, ищем в ней директорию с именем базы данных
    if [ -d "$IMPORT_SOURCE/$DB_NAME" ]; then
        RESTORE_PATH="$IMPORT_SOURCE/$DB_NAME"
    else
        # Или используем саму директорию, если она содержит данные
        RESTORE_PATH="$IMPORT_SOURCE"
    fi
else
    echo "❌ Ошибка: Файл или директория не найдены: $IMPORT_SOURCE"
    exit 1
fi

if [ ! -d "$RESTORE_PATH" ]; then
    echo "❌ Ошибка: Не удалось найти данные для импорта в $IMPORT_SOURCE"
    exit 1
fi

echo "📥 Импорт базы данных..."
echo "🔌 Подключение: ${MONGO_HOST}:${MONGO_PORT}"
echo "📁 Источник: $RESTORE_PATH"
echo "💾 База данных: $DB_NAME"
echo ""
read -p "⚠️  ВНИМАНИЕ: Это перезапишет существующие данные в базе '$DB_NAME'. Продолжить? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Импорт отменен"
    exit 1
fi

# Выполняем mongorestore
mongorestore \
    --host="${MONGO_HOST}:${MONGO_PORT}" \
    --db="$DB_NAME" \
    --drop \
    "$RESTORE_PATH"

echo "✅ Импорт завершен!"
echo "🎉 Готово!"

