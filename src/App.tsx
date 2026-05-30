import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import ActiveSessionBanner from "./components/activeSessionBanner/activeSessionBanner.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import Modal from "./components/modal/modal.tsx";
import GuestAuth from './components/guestAuth/guestAuth.tsx';
import RoomPage from "./components/roomPage/roomPage.tsx";
import ProfilePage from "./components/profilePage/profilePage.tsx";
import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import GameRoom from "./components/gameRoom/gameRoom.tsx";
import { roomService } from './api/room.ts';
import { authService } from './api/auth.ts';
import { ConfirmModal } from './components/confirmModal/confirmModal.tsx';
import elfCampfireImg from './assets/elf-campfire.png';

function App() {
  const [activeModal, setActiveModal] = useState<boolean>(false);
  const [isRoomFullModal, setIsRoomFullModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const openModal = () => setActiveModal(true);
  const closeModal = () => setActiveModal(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, actor, token, setCurrentRoom } = useUserStore();

  // Fetch currentRoom from /me on mount / auth change (registered users only)
  useEffect(() => {
    if (!isAuthenticated || !token || actor?.type === 'guest') return;

    authService.getMe(token)
      .then((data) => setCurrentRoom(data.currentRoom ?? null))
      .catch(() => { /* silently ignore — session may be stale or network error */ });
  }, [isAuthenticated, token, actor?.type]);

  useEffect(() => {
    const isRoomPage = location.pathname.startsWith('/room/') && !location.pathname.startsWith('/room/game/');

    if (isRoomPage && !isAuthenticated && !isLoggingOut) {
      const inviteCode = location.pathname.split('/room/')[1];
      if (inviteCode) {
        roomService.getRoomById(inviteCode)
          .then((data) => {
            if (data.room.playersCount >= data.room.maxPlayers) {
              setIsRoomFullModal(true);
              setActiveModal(false);
            } else {
              setActiveModal(true);
            }
          })
          .catch(() => {
            setActiveModal(true);
          });
      } else {
        setActiveModal(true);
      }
    } else {
      setActiveModal(false);
      setIsRoomFullModal(false);
    }
  }, [location.pathname, isAuthenticated, isLoggingOut]);

  const handleCancelAuth = () => {
    closeModal();
    if (location.pathname.startsWith('/room/') && !isAuthenticated) {
      navigate('/');
    }
  };

  const handleGuestConfirm = () => {
    closeModal();
  };

  const handleRoomFullClose = () => {
    setIsRoomFullModal(false);
    navigate('/');
  };

  return (
      <div className={styles.layoutWrapper}>
        <Header />
        <ActiveSessionBanner />
          <Routes>
            <Route path="/" element={
              <MainPage onPlayClick={openModal} />
            } />
            <Route path="/room/:id" element={<RoomPage />} />
            <Route path="/room/game/:id" element={<GameRoom />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>

        <Modal isOpen={activeModal} onClose={handleCancelAuth}>
          <GuestAuth
            onConfirm={handleGuestConfirm}
            onCancel={handleCancelAuth}
          />
        </Modal>

        <Modal isOpen={isRoomFullModal} onClose={handleRoomFullClose}>
          <ConfirmModal
            title="Комната заполнена"
            text="К сожалению, в этой комнате уже нет свободных мест. Все слоты заняты другими игроками. Попробуйте присоединиться к другой комнате или создайте свою."
            onConfirm={handleRoomFullClose}
            onConfirmText="На главную"
            image={elfCampfireImg}
          />
        </Modal>
      </div>
  )
}

export default App
