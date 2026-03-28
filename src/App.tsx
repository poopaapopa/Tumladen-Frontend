import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import Modal from "./components/modal/modal.tsx";
import GuestAuth from './components/guestAuth/guestAuth.tsx';
import RoomPage from "./components/roomPage/roomPage.tsx";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeModal, setActiveModal] = useState<boolean>(false);

  const openModal = () => setActiveModal(true);
  const closeModal = () => setActiveModal(false);

  const handleGuestConfirm = () => {
    closeModal();
  };

  return (
    <Router>
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
          </Routes>

        <Modal isOpen={activeModal} onClose={closeModal}>
          <GuestAuth
            onConfirm={handleGuestConfirm}
            onCancel={closeModal}
          />
        </Modal>

        {isSelecting && <div className={styles.globalOverlay} onClick={() => setIsSelecting(false)} />}
      </div>
    </Router>
  )
}

export default App
