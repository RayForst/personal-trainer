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

# Функция для поиска директории с коллекциями MongoDB (содержит .bson файлы)
find_mongo_data_dir() {
    local search_dir="$1"
    # Ищем директорию, которая содержит .bson файлы (коллекции MongoDB)
    local found_dir=$(find "$search_dir" -type f -name "*.bson" 2>/dev/null | head -n 1 | xargs dirname 2>/dev/null)
    
    if [ -n "$found_dir" ] && [ -d "$found_dir" ]; then
        echo "$found_dir"
        return 0
    fi
    
    # Если не нашли .bson файлы, ищем директорию с именем базы данных
    found_dir=$(find "$search_dir" -type d -name "$DB_NAME" 2>/dev/null | head -n 1)
    if [ -n "$found_dir" ] && [ -d "$found_dir" ]; then
        echo "$found_dir"
        return 0
    fi
    
    # Если ничего не нашли, возвращаем исходную директорию
    echo "$search_dir"
    return 1
}

# Проверяем, является ли источник архивом или директорией
if [ -f "$IMPORT_SOURCE" ] && ([[ "$IMPORT_SOURCE" == *.tar.gz ]] || [[ "$IMPORT_SOURCE" == *.tgz ]]); then
    echo "📦 Распаковка архива..."
    tar -xzf "$IMPORT_SOURCE" -C "$TEMP_DIR" 2>/dev/null || tar -xzf "$IMPORT_SOURCE" -C "$TEMP_DIR"
    # Ищем директорию с данными MongoDB
    RESTORE_PATH=$(find_mongo_data_dir "$TEMP_DIR")
elif [ -d "$IMPORT_SOURCE" ]; then
    # Если это директория, ищем в ней директорию с данными
    RESTORE_PATH=$(find_mongo_data_dir "$IMPORT_SOURCE")
else
    echo "❌ Ошибка: Файл или директория не найдены: $IMPORT_SOURCE"
    exit 1
fi

# Проверяем, что директория существует и содержит данные
if [ ! -d "$RESTORE_PATH" ]; then
    echo "❌ Ошибка: Не удалось найти данные для импорта в $IMPORT_SOURCE"
    exit 1
fi

# Проверяем наличие .bson файлов (коллекций)
if [ -z "$(find "$RESTORE_PATH" -maxdepth 1 -name "*.bson" 2>/dev/null)" ]; then
    echo "⚠️  Предупреждение: В директории $RESTORE_PATH не найдено .bson файлов"
    echo "   Продолжаем импорт, но возможно структура архива неверна"
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
# Используем --nsInclude вместо устаревшего --db
mongorestore \
    --host="${MONGO_HOST}:${MONGO_PORT}" \
    --nsInclude="${DB_NAME}.*" \
    --drop \
    "$RESTORE_PATH"

echo "✅ Импорт завершен!"
echo "🎉 Готово!"

