import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import "./BottomNavbar.scss";

const MOBILE_BREAKPOINT = 992;

const BottomNavbar = ({ onCameraClick }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Do not render on desktop
  if (!isMobile) return null;

  return (
    <nav className="camera-bottom-navbar" aria-hidden={!isMobile}>
      <button
        className="camera-bottom-navbar-btn"
        aria-label="Open Camera"
        onClick={onCameraClick}
      >
        <Camera className="camera-bottom-navbar-icon" />
      </button>
    </nav>
  );
};

export default BottomNavbar;