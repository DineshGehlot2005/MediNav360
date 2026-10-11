import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

const NODES = [
  "Entrance",
  "Reception",
  "Main Corridor",
  "Elevator",
  "Pharmacy",
  "General Medicine",
  "Dermatology",
  "ENT",
  "Cardiology",
  "Orthopedics",
  "Neurology",
];

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let scanner = null;

    async function startScanner() {
      try {
        // Dynamic import — sirf jab modal khule tab load ho
        const { Html5Qrcode } = await import("html5-qrcode");

        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR decode ho gaya — URL se source extract karo
            try {
              const url = new URL(decodedText);
              const sourceParam = url.searchParams.get("source");
              if (sourceParam && NODES.includes(sourceParam)) {
                onScan(sourceParam);
                scanner.stop().catch(() => {});
              } else {
                setError("Invalid QR code. Please scan a hospital location QR.");
              }
            } catch {
              // Agar plain text QR hai (URL nahi), toh direct node name check karo
              if (NODES.includes(decodedText)) {
                onScan(decodedText);
                scanner.stop().catch(() => {});
              } else {
                setError("Invalid QR code. Please scan a hospital location QR.");
              }
            }
          },
          () => {
            // Ignore per-frame errors
          }
        );
        setScanning(false);
      } catch (err) {
        setError(
          "Camera access denied. Please allow camera permission or enter location manually."
        );
        setScanning(false);
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="qr-scanner-modal" onClick={onClose}>
      <div className="qr-scanner-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <h2>
            <Icon name="grid" size={20} /> Scan QR Code
          </h2>
          <button
            type="button"
            className="qr-scanner-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="qr-scanner-hint">
          Point your camera at the QR code placed at your current hospital
          location.
        </p>

        <div className="qr-reader-wrap">
          <div id="qr-reader" />
          {scanning && (
            <div className="qr-scanning-overlay">
              <span className="button-spinner" /> Starting camera...
            </div>
          )}
        </div>

        {error && <div className="feature-error">{error}</div>}

        <div className="qr-scanner-footer">
          <Icon name="info" size={14} />
          <span>Camera access required. Your data is not stored.</span>
        </div>
      </div>
    </div>
  );
}