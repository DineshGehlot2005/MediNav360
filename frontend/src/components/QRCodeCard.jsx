import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeCard({ nodeName, baseUrl = window.location.origin }) {
  const qrRef = useRef(null);

  // URL jo QR code mein encode hoga
  const navUrl = `${baseUrl}/?source=${encodeURIComponent(nodeName)}`;

  // QR code download karne ke liye
  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 20, 20, 360, 360);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${nodeName.replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="qr-code-card">
      <div className="qr-code-svg-wrap" ref={qrRef}>
        <QRCodeSVG
          value={navUrl}
          size={160}
          bgColor="#ffffff"
          fgColor="#0f305b"
          level="M"
          includeMargin={true}
        />
      </div>
      <div className="qr-code-info">
        <h3>{nodeName}</h3>
        <p className="qr-code-url">{navUrl}</p>
        <button
          type="button"
          className="feature-secondary qr-download-btn"
          onClick={downloadQR}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}