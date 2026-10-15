import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorldStage } from './world/WorldStage';
import { startHashSync } from './world/store';
import { HeroOverlay } from './world/ui/HeroOverlay';
import { LandmarkLabels } from './world/ui/LandmarkLabels';
import { LocationRail } from './world/ui/LocationRail';
import { preloadPanels, SectionPanel } from './world/ui/SectionPanel';
import { WorldControls } from './world/ui/WorldControls';

/**
 * The portfolio is one persistent world. Navigation changes the camera and
 * the content panel; the world itself is never torn down.
 *
 * Layers (back → front): world · hero intro · landmark labels · panel · nav.
 */
export default function App() {
  useEffect(() => startHashSync(), []);
  useEffect(() => {
    const id = setTimeout(preloadPanels, 2500);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Skip to content
      </a>
      <WorldStage />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <HeroOverlay />
        <LandmarkLabels />
        <SectionPanel />
        <WorldControls />
        <LocationRail />
      </main>
    </>
  );
}
