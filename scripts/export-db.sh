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
echo ""

# Получаем информацию о коллекциях и количестве документов перед экспортом
echo "🔍 Анализ базы данных..."
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    MONGO_CMD=""
fi

if [ -n "$MONGO_CMD" ]; then
    # Получаем список коллекций и количество документов
    COLLECTIONS_INFO=$($MONGO_CMD --quiet --host="${MONGO_HOST}:${MONGO_PORT}" "$DB_NAME" --eval "
        db.getCollectionNames().forEach(function(collection) {
            var count = db[collection].countDocuments();
            print(collection + '|' + count);
        });
    " 2>/dev/null || echo "")
    
    if [ -n "$COLLECTIONS_INFO" ]; then
        TOTAL_DOCS=0
        COLLECTION_COUNT=0
        while IFS='|' read -r collection count; do
            if [ -n "$collection" ] && [ -n "$count" ]; then
                COLLECTION_COUNT=$((COLLECTION_COUNT + 1))
                TOTAL_DOCS=$((TOTAL_DOCS + count))
            fi
        done <<< "$COLLECTIONS_INFO"
        
        if [ "$COLLECTION_COUNT" -gt 0 ]; then
            echo "📊 Найдено коллекций: $COLLECTION_COUNT"
            echo "📄 Всего документов: $TOTAL_DOCS"
        fi
    fi
fi

echo ""

# Выполняем mongodump
# mongodump создает структуру: EXPORT_PATH/DB_NAME/*.bson
mongodump \
    --host="${MONGO_HOST}:${MONGO_PORT}" \
    --db="$DB_NAME" \
    --out="$EXPORT_DIR" \
    --quiet

# Путь к директории с данными базы (mongodump создает DB_NAME/ внутри EXPORT_DIR)
DB_DATA_DIR="${EXPORT_DIR}/${DB_NAME}"

# Проверяем, что данные экспортированы
if [ ! -d "$DB_DATA_DIR" ]; then
    echo "❌ Ошибка: Не удалось экспортировать данные базы"
    exit 1
fi

# Собираем отладочную информацию
echo ""
echo "📊 Статистика экспорта:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Подсчитываем коллекции (файлы .bson, исключая метаданные macOS)
COLLECTIONS=$(find "$DB_DATA_DIR" -maxdepth 1 -name "*.bson" ! -name "._*" 2>/dev/null | wc -l | tr -d ' ')
echo "📚 Коллекций экспортировано: $COLLECTIONS"

# Показываем информацию о каждой коллекции
if [ "$COLLECTIONS" -gt 0 ]; then
    echo ""
    echo "📋 Детали коллекций:"
    TOTAL_SIZE=0
    for bson_file in "$DB_DATA_DIR"/*.bson; do
        # Пропускаем метаданные macOS
        if [[ "$(basename "$bson_file")" == ._* ]]; then
            continue
        fi
        
        if [ -f "$bson_file" ]; then
            collection_name=$(basename "$bson_file" .bson)
            file_size=$(stat -f%z "$bson_file" 2>/dev/null || stat -c%s "$bson_file" 2>/dev/null || echo "0")
            TOTAL_SIZE=$((TOTAL_SIZE + file_size))
            
            # Форматируем размер файла
            if [ "$file_size" -gt 1048576 ]; then
                size_display=$(echo "scale=2; $file_size/1048576" | bc 2>/dev/null || echo "$file_size")
                size_unit="MB"
            elif [ "$file_size" -gt 1024 ]; then
                size_display=$(echo "scale=2; $file_size/1024" | bc 2>/dev/null || echo "$file_size")
                size_unit="KB"
            else
                size_display="$file_size"
                size_unit="B"
            fi
            
            # Пытаемся получить количество документов из предварительно собранной информации
            doc_count="N/A"
            if [ -n "$COLLECTIONS_INFO" ]; then
                while IFS='|' read -r coll_name count; do
                    if [ "$coll_name" = "$collection_name" ]; then
                        doc_count="$count"
                        break
                    fi
                done <<< "$COLLECTIONS_INFO"
            fi
            
            if [ "$doc_count" != "N/A" ]; then
                echo "   • $collection_name: ${size_display} ${size_unit} ($doc_count документов)"
            else
                echo "   • $collection_name: ${size_display} ${size_unit}"
            fi
        fi
    done
    
    # Форматируем общий размер
    if [ "$TOTAL_SIZE" -gt 1048576 ]; then
        total_display=$(echo "scale=2; $TOTAL_SIZE/1048576" | bc 2>/dev/null || echo "$TOTAL_SIZE")
        total_unit="MB"
    elif [ "$TOTAL_SIZE" -gt 1024 ]; then
        total_display=$(echo "scale=2; $TOTAL_SIZE/1024" | bc 2>/dev/null || echo "$TOTAL_SIZE")
        total_unit="KB"
    else
        total_display="$TOTAL_SIZE"
        total_unit="B"
    fi
    
    echo ""
    echo "💾 Общий размер данных: ${total_display} ${total_unit}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Создаем архив
if command -v tar &> /dev/null; then
    echo "📦 Создание архива..."
    cd "$EXPORT_DIR"
    # Архивируем только директорию с данными базы, без временной обертки
    tar -czf "${DB_NAME}_${TIMESTAMP}.tar.gz" "$DB_NAME"
    rm -rf "$DB_NAME"
    echo "✅ Экспорт завершен: ${EXPORT_DIR}/${DB_NAME}_${TIMESTAMP}.tar.gz"
else
    echo "✅ Экспорт завершен: ${DB_DATA_DIR}"
fi

echo "🎉 Готово!"

