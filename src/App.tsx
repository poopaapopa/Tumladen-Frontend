import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import Modal from "./components/modal/modal.tsx";
import GuestAuth from './components/guestAuth/guestAuth.tsx';
import { useState } from "react";

function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeModal, setActiveModal] = useState<boolean>(false);

  const openModal = () => setActiveModal(true);
  const closeModal = () => setActiveModal(false);

  const handleGuestConfirm = (name: string) => {
    console.log("Никнейм игрока:", name);
    closeModal();
  };

  return (
    <div className={styles.layoutWrapper}>
      <Header />
        <MainPage
          isSelecting={isSelecting}
          setIsSelecting={setIsSelecting}
          onPlayClick={openModal}
        />

      <Modal isOpen={activeModal} onClose={closeModal}>
        <GuestAuth
          onConfirm={handleGuestConfirm}
          onCancel={closeModal}
        />
      </Modal>

      {isSelecting && <div className={styles.globalOverlay} onClick={() => setIsSelecting(false)} />}
    </div>
  )
}

export default App
