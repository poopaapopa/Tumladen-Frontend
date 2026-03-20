import styles from './App.module.scss';
import Header from "./components/header/header.tsx";
import Sidebar from "./components/sidebar/sidebar.tsx";
import MainPage from "./components/mainPage/mainPage.tsx";

function App() {

  return (
    <div className={styles.layoutWrapper}>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar />
        <MainPage />
      </div>
    </div>
  )
}

export default App
