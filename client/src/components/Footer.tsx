import { Link } from "react-router-dom";

export function Footer() {
  const footerLinks = {
    "About Us": "/about",
    Contact: "/contact",
    "Custom Orders": "/custom-order",
    "Track Order": "/track-order",
    Blog: "/blog",
    FAQs: "/faqs",
    "Shipping Policy": "/shipping-policy",
    "Returns Policy": "/returns-policy",
    "Privacy Policy": "/privacy-policy",
    Terms: "/terms",
  } as const;

  return (
    <footer className="mt-16 bg-navy px-4 py-12 text-gold-light">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-display text-3xl text-gold">INNOVA CREATIONS</h3>
          <p>Illuminating Spaces with Elegance</p>
          <p className="mt-4 rounded-full border border-gold px-3 py-1 text-sm">
            Made in India with love
          </p>
        </div>
        {["Quick Links", "Customer Service"].map((h, i) => (
          <div key={h}>
            <h4 className="mb-3 font-semibold text-gold">{h}</h4>
            {(i
              ? [
                  "FAQs",
                  "Shipping Policy",
                  "Returns Policy",
                  "Privacy Policy",
                  "Terms",
                ]
              : ["About Us", "Contact", "Custom Orders", "Track Order", "Blog"]
            ).map((x) => (
              <Link
                key={x}
                className="block py-1"
                to={footerLinks[x as keyof typeof footerLinks]}
              >
                {x}
              </Link>
            ))}
          </div>
        ))}
        <div>
          <h4 className="mb-3 font-semibold text-gold">Contact & Store</h4>
          <p>MG Road, Mumbai, Maharashtra</p>
          <p>+91-98765-43210</p>
          <p>innova@example.com</p>
          <div className="mt-3 h-20 rounded border border-gold/40 bg-white/10" />
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-gold/30 pt-5 text-sm">
        © 2026 Innova Creations. All Rights Reserved. Visa | Mastercard | UPI | Stripe
      </div>
    </footer>
  );
}
