import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import Sidebar from "./components/sidebar/sidebar.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import { useState } from "react";

function App() {
  const [isSelecting, setIsSelecting] = useState(false);

  return (
    <div className={styles.layoutWrapper}>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar onCreateClick={() => setIsSelecting(true)} />
        <MainPage
          isSelecting={isSelecting}
          onCancel={() => setIsSelecting(false)}
        />
      </div>

      {isSelecting && <div className={styles.globalOverlay} onClick={() => setIsSelecting(false)} />}
    </div>
  )
}

export default App
