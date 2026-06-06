import { MessageCircle } from "lucide-react";

export function WhatsApp() {
  return (
    <a
      aria-label="WhatsApp chat"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white shadow-xl"
      href="https://wa.me/919876543210?text=Hi!%20I'm%20interested%20in%20your%20products%20at%20Innova%20Creations."
    >
      <MessageCircle />
    </a>
  );
}
