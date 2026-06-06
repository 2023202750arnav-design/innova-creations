# Innova Creations

Production-grade full-stack e-commerce website for luxury decorative lights and chandeliers.

## Stack

- Client: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion, Swiper, Lucide, Stripe.js.
- Server: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis-ready rate limiting/session hooks, JWT cookies, Stripe, Nodemailer/Handlebars, Multer/Cloudinary hooks, Winston, Helmet, CORS.

## Setup

1. Install Node 18+, PostgreSQL, and Redis.
2. Copy env values:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Prepare database:
   ```bash
   npm --workspace server run prisma:migrate
   npm --workspace server run seed
   ```
5. Run development:
   ```bash
   npm run dev
   ```

Client runs at `http://localhost:5173`; API runs at `http://localhost:5000/api/v1`.

## Docker

```bash
docker compose up --build
```

## Default Admin

- Email: `admin@innovacreations.com`
- Password: `Admin@Innova2026`

## Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Authentication: `4000 0025 0000 3155`
- Decline: `4000 0000 0000 9995`

## API Summary

All routes are prefixed with `/api/v1`.

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh-token`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me`
- Products: `/products`, `/products/:slug`, `/products/search`
- Cart: `/cart`, `/cart/add`, `/cart/update`, `/cart/remove/:itemId`, `/cart/clear`
- Wishlist: `/wishlist`, `/wishlist/add`, `/wishlist/remove/:productId`
- Orders: `/orders`, `/orders/:orderId`, `/orders/:orderId/cancel`, `/admin/orders`, `/admin/orders/:orderId/status`
- Payment: `/payment/create-intent`, `/payment/webhook`
- Admin: `/admin/dashboard/stats`, `/admin/dashboard/charts`, `/admin/users`, `/admin/products`, `/admin/categories`, `/admin/coupons`, `/admin/reviews`, `/admin/banners`

The server includes realistic in-memory fallbacks for immediate local demos and a complete Prisma schema/seed for PostgreSQL-backed development.
