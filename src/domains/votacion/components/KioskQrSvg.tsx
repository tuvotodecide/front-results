"use client";

import { QRCodeSVG } from "qrcode.react";

type KioskQrSvgProps = {
  value: string;
  size?: number;
  className?: string;
};

export default function KioskQrSvg({
  value,
  size = 320,
  className,
}: KioskQrSvgProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      marginSize={1}
      bgColor="#FFFFFF"
      fgColor="#174F2E"
      level="M"
      title="Código QR"
      className={className}
    />
  );
}
