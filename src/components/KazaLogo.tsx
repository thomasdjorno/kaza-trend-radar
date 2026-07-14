import Image from "next/image";

export default function KazaLogo({ className = "h-10" }: { className?: string }) {
  return (
    <Image
      src="/kaza-logo.png"
      alt="Maison KAZA"
      width={1669}
      height={637}
      className={`w-auto ${className}`}
      priority
    />
  );
}
