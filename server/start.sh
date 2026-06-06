#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."

# Loop up to 30 times (60 seconds max) to wait for database connection
for i in $(seq 1 30); do
  npx prisma db push && break
  echo "Database connection failed, retrying in 2 seconds ($i/30)..."
  sleep 2
done

# Run database seed
npx prisma db seed || echo "Seeding completed or skipped"

echo "Starting Express API dev server..."
exec npm run dev
