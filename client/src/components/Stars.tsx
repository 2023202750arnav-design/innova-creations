import { Star } from "lucide-react";

interface StarsProps {
  value: number;
}

export function Stars({ value }: StarsProps) {
  return (
    <span className="inline-flex align-middle">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < Math.round(value) ? "#C9A84C" : "none"}
          color="#C9A84C"
        />
      ))}
    </span>
  );
}
