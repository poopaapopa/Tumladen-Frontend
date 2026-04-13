import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import Modal from "./components/modal/modal.tsx";
import GuestAuth from './components/guestAuth/guestAuth.tsx';
import RoomPage from "./components/roomPage/roomPage.tsx";
import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import GameRoom from "./components/gameRoom/gameRoom.tsx";

function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeModal, setActiveModal] = useState<boolean>(false);

  const openModal = () => setActiveModal(true);
  const closeModal = () => setActiveModal(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    const isRoomPage = location.pathname.startsWith('/room/');
    
    if (isRoomPage && !isAuthenticated) {
      const timer = setTimeout(() => {
        setActiveModal(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isAuthenticated]);

  const handleCancelAuth = () => {
    closeModal();
    if (location.pathname.startsWith('/room/') && !isAuthenticated) {
      navigate('/');
    }
  };

  const handleGuestConfirm = () => {
    closeModal();
  };

  return (
      <div className={styles.layoutWrapper}>
        <Header />
          <Routes>
            <Route path="/" element={
              <MainPage
                isSelecting={isSelecting}
                setIsSelecting={setIsSelecting}
                onPlayClick={openModal}
              />
            } />
            <Route path="/room/:id" element={<RoomPage />} />
            <Route path="/room/game/:id" element={<GameRoom />} />
          </Routes>

        <Modal isOpen={activeModal} onClose={handleCancelAuth}>
          <GuestAuth
            onConfirm={handleGuestConfirm}
            onCancel={handleCancelAuth}
          />
        </Modal>

        {isSelecting && <div className={styles.globalOverlay} onClick={() => setIsSelecting(false)} />}
      </div>
  )
}

export default App
