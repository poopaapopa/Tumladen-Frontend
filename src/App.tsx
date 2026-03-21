import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import Sidebar from "./components/sidebar/sidebar.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoomPage from './components/roomPage/roomPage.tsx'; 

function App() {

  return (
    <Router>
      <div className={styles.appWrapper}>
        <Header />
        <div className={styles.contentWrapper}>
          <Sidebar />
          <main>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/room/:room_id" element={<RoomPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
