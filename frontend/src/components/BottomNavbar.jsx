import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import "./BottomNavbar.scss"; // Add this line

const BottomNavbar = ({ onCameraClick }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Do not render on desktop
  if (!isMobile) return null;

  return (
    <nav className="bottom-navbar" aria-hidden={!isMobile}>
      <button
        className="camera-btn"
        aria-label="Open Camera"
        onClick={onCameraClick}
      >
        <Camera className="icon" />
      </button>
    </nav>
  );
};

export default BottomNavbar;