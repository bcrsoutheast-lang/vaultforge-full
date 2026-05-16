"use client";

import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
}

type Props = {
  children?: React.ReactNode;
  to?: string;
  title?: string;
  roomId?: string;
  roomType?: string;
  folder?: string;
  sourceRoute?: string;
  kind?: string;
  style?: React.CSSProperties;
};

export default function VaultForgeRoomMessageLink({
  children = "Request Info / Intro",
  to = "bcrsoutheast@gmail.com",
  title = "VaultForge Room",
  roomId = "",
  roomType = "VaultForge Room",
  folder = "general",
  sourceRoute = "",
  kind = "room",
  style,
}: Props) {
  const safeTitle = clean(title) || "VaultForge Room";
  const safeRoomId = clean(roomId);
  const safeRoomType = clean(roomType) || "VaultForge Room";
  const safeFolder = clean(folder) || "general";
  const safeSourceRoute = clean(sourceRoute);

  const href =
    `/messages/new?to=${encodeURIComponent(to)}` +
    `&subject=${encodeURIComponent(safeTitle)}` +
    `&room_title=${encodeURIComponent(safeTitle)}` +
    `&title=${encodeURIComponent(safeTitle)}` +
    `&room_type=${encodeURIComponent(safeRoomType)}` +
    `&room_id=${encodeURIComponent(safeRoomId)}` +
    `&item_id=${encodeURIComponent(safeRoomId)}` +
    `&signal_id=${encodeURIComponent(safeRoomId)}` +
    `&source=${encodeURIComponent(`${kind}-room`)}` +
    `&type=${encodeURIComponent(kind)}` +
    `&folder=${encodeURIComponent(safeFolder)}` +
    `&source_route=${encodeURIComponent(safeSourceRoute)}`;

  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}
