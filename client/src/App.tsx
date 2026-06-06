import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WhatsApp } from "./components/WhatsApp";
import { Home } from "./pages/Home";
import { Listing } from "./pages/Listing";
import { ProductDetail } from "./pages/ProductDetail";
import { CartPage } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Success } from "./pages/Success";
import { TrackOrder } from "./pages/TrackOrder";
import { Auth } from "./pages/Auth";
import { Account, AccountRoute } from "./pages/Account";
import { Admin, AdminRoute } from "./pages/Admin";
import { StaticPage } from "./pages/StaticPage";

function Shell() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Listing />} />
        <Route path="/products/category/:slug" element={<Listing />} />
        <Route path="/search" element={<Listing />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/success/:id" element={<Success />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/login" element={<Auth mode="Login" />} />
        <Route path="/register" element={<Auth mode="Register" />} />
        <Route path="/forgot-password" element={<Auth mode="Forgot Password" />} />
        <Route path="/reset-password" element={<Auth mode="Forgot Password" />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/:page" element={<AccountRoute />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/:page" element={<AdminRoute />} />
        {[
          "about",
          "contact",
          "shipping-policy",
          "returns-policy",
          "privacy-policy",
          "terms",
          "custom-order",
          "inspiration",
          "faqs",
          "blog",
          "sitemap",
        ].map((p) => (
          <Route
            key={p}
            path={`/${p}`}
            element={
              <StaticPage
                title={p
                  .split("-")
                  .map((x) => x[0].toUpperCase() + x.slice(1))
                  .join(" ")}
              />
            }
          />
        ))}
        <Route path="*" element={<StaticPage title="404 Not Found" />} />
      </Routes>
      <Footer />
      <WhatsApp />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
