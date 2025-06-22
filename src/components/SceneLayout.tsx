"use client";

import dynamic from "next/dynamic";

// Dynamically import the Scene component with no SSR to prevent hydration issues
const Scene = dynamic(() => import("./three/Scene"), { ssr: false });

interface SceneLayoutProps {
  className?: string;
}

const SceneLayout: React.FC<SceneLayoutProps> = ({ className = "" }) => {
  return (
    <div className={`w-full h-screen ${className}`}>
      <Scene showStats={process.env.NODE_ENV === "development"} />
    </div>
  );
};

export default SceneLayout;
