"use client";

import { useEffect, useState } from "react";
import {
  Envelope,
  FacebookLogo,
  TelegramLogo,
  TwitterLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";

export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Bagikan ke Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-[#1877F2] hover:brightness-110",
      Icon: FacebookLogo,
    },
    {
      label: "Bagikan ke Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "bg-[#1DA1F2] hover:brightness-110",
      Icon: TwitterLogo,
    },
    {
      label: "Bagikan ke Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      className: "bg-[#229ED9] hover:brightness-110",
      Icon: TelegramLogo,
    },
    {
      label: "Bagikan ke WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: "bg-[#25D366] hover:brightness-110",
      Icon: WhatsappLogo,
    },
    {
      label: "Bagikan lewat Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      className: "bg-[#EA4335] hover:brightness-110",
      Icon: Envelope,
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {links.map(({ label, href, className, Icon }) => (
        <a
          key={label}
          href={url ? href : "#"}
          target={label.includes("Email") ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-white transition ${className}`}
        >
          <Icon className="h-4 w-4" weight="fill" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
