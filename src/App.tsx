import { useLock } from './context/LockContext';
import LockScreen from './components/LockScreen';
import TeacherToolbar from './components/TeacherToolbar';
import SetupScreen from './components/SetupScreen';
import Updater from './components/Updater';
import AnnouncementOverlay from './components/AnnouncementOverlay';

export default function App() {
  const { isLocked, isSetupRequired } = useLock();

  // Kurulum gerekiyorsa (ilk açılış)
  if (isSetupRequired) return <SetupScreen />;

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent flex flex-col items-center select-none font-sans relative pointer-events-none">
      
      {/* Otomatik Güncelleyici */}
      <Updater />

      {/* Duyuru Bandı (Mouse Korumalı) */}
      <AnnouncementOverlay />

      {/* EKRAN YÖNETİMİ (Kilitli mi Açık mı?) */}
      <div className="pointer-events-auto w-full h-full relative z-40">
        {isLocked ? <LockScreen /> : <TeacherToolbar />}
      </div>
    </div>
  );
}