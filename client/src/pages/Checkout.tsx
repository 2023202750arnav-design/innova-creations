import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { useShop } from "../store";
import { createOrder } from "../api";
import { Seo } from "../components/Seo";
import { CartPage } from "./Cart";

const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(8, "Address must be at least 8 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  pincode: z.string().min(5, "Pincode must be at least 5 characters"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function Checkout() {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Pay on Delivery");
  const [placing, setPlacing] = useState(false);
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });
  const nav = useNavigate();
  const { cart, clearCart } = useShop();

  const autocompleteMap: Record<string, string> = {
    name: "name",
    email: "email",
    phone: "tel",
    address: "street-address",
    city: "address-level2",
    pincode: "postal-code",
  };

  const placeOrder = async () => {
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder({
        items: cart.map((line) => ({
          productId: line.product.id,
          sku: line.product.sku,
          quantity: line.qty,
        })),
        address: form.getValues() as Record<string, string>,
        paymentMethod,
      });
      const saved = { ...order, eta: "3-5 business days" };
      localStorage.setItem("innova-last-order", JSON.stringify(saved));
      clearCart();
      toast.success("Order placed successfully");
      nav(`/order/success/${order.orderNumber}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Seo title="Checkout" description="Secure checkout with delivery and payment." />
      <h1 className="font-display text-5xl">Checkout</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Delivery Information", "Order Review", "Payment"].map((s, i) => (
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              step === i + 1 ? "bg-gold text-navy" : "bg-white text-mid border border-gold/20"
            }`}
            key={s}
          >
            {s}
          </span>
        ))}
      </div>
      {step === 1 && (
        <form
          className="mt-6 grid gap-4 rounded bg-white p-6 border border-gold/15 md:grid-cols-2"
          onSubmit={form.handleSubmit(() => setStep(2))}
        >
          {(["name", "email", "phone", "address", "city", "pincode"] as const).map((x) => {
            const hasError = !!form.formState.errors[x];
            const errorMsg = form.formState.errors[x]?.message;
            const autocomplete = autocompleteMap[x] || "off";
            const label = x.charAt(0).toUpperCase() + x.slice(1);
            return (
              <div
                key={x}
                className={`flex flex-col gap-1.5 ${
                  x === "address" ? "md:col-span-2" : ""
                }`}
              >
                <label
                  htmlFor={`checkout-${x}`}
                  className="text-sm font-semibold text-charcoal"
                >
                  {label}
                </label>
                <input
                  id={`checkout-${x}`}
                  {...form.register(x)}
                  autoComplete={autocomplete}
                  placeholder={`Enter your ${x}`}
                  aria-invalid={hasError ? "true" : "false"}
                  aria-describedby={hasError ? `checkout-${x}-error` : undefined}
                  className={`rounded border px-4 py-2.5 min-h-[48px] ${
                    hasError
                      ? "border-burgundy focus:outline-burgundy"
                      : "border-gold/40 focus:outline-gold"
                  }`}
                />
                {hasError && (
                  <span
                    id={`checkout-${x}-error`}
                    className="text-xs font-semibold text-burgundy"
                    aria-live="polite"
                  >
                    {errorMsg || `Invalid ${x}`}
                  </span>
                )}
              </div>
            );
          })}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label
              htmlFor="checkout-shipping"
              className="text-sm font-semibold text-charcoal"
            >
              Shipping Method
            </label>
            <select
              id="checkout-shipping"
              className="rounded border border-gold/40 px-3 py-2.5 h-[48px] focus:outline-gold bg-white"
            >
              <option>Standard</option>
              <option>Express</option>
              <option>Same Day Mumbai</option>
            </select>
          </div>
          <button
            type="submit"
            className="gold-btn rounded px-5 py-3 font-semibold md:col-span-2 min-h-[48px]"
          >
            Continue
          </button>
        </form>
      )}
      {step === 2 && (
        <div className="mt-6 rounded bg-white p-6 border border-gold/15">
          <CartPage />
          <button
            onClick={() => setStep(3)}
            className="gold-btn rounded px-5 py-3 font-semibold mt-4"
          >
            Payment
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="mt-6 rounded bg-white p-6 border border-gold/15">
          <h2 className="font-display text-3xl">Payment</h2>
          <p className="text-mid text-sm mt-1">
            Choose a payment method. Online gateway keys can be enabled for production;
            pay on delivery works immediately.
          </p>
          <div className="mt-4 grid gap-3">
            {["Card", "UPI", "Net Banking", "Pay on Delivery"].map((x) => (
              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded border border-gold/15 hover:bg-cream transition"
                key={x}
              >
                <input
                  name="pay"
                  type="radio"
                  checked={paymentMethod === x}
                  onChange={() => setPaymentMethod(x)}
                  className="accent-gold h-4 w-4"
                />{" "}
                <span className="font-semibold text-charcoal">{x}</span>
              </label>
            ))}
          </div>
          <button
            disabled={placing}
            onClick={placeOrder}
            className="gold-btn mt-6 inline-flex items-center gap-2 rounded px-5 py-3 disabled:opacity-60 font-semibold"
          >
            <Lock size={18} /> {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      )}
    </main>
  );
}
