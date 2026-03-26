import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import Sidebar from "./components/sidebar/sidebar.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import RoomPage from "./components/roomPage/roomPage.tsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from "react";

function App() {
  const [isSelecting, setIsSelecting] = useState(false);

  return (
    <Router>
      <div className={styles.layoutWrapper}>
        <Header />
        <Routes>
          <Route path="/" element={
            <div className={styles.pageWrapper}>
              <Sidebar onCreateClick={() => setIsSelecting(true)} />
              <MainPage isSelecting={isSelecting} onCancel={() => setIsSelecting(false)} />
              {isSelecting && <div className={styles.globalOverlay} onClick={() => setIsSelecting(false)} />}
            </div>
          } />
          <Route path="/room/:id" element={<RoomPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
