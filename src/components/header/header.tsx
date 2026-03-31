import styles from './header.module.scss';
import logo from '../../assets/logo_168x92.png';

function Header() {

  return (
    <header className={styles.header}>
      <div className={styles.header__left} onClick={() => window.location.href = '/'}>
        <img src={logo} alt="Tumladen Logo" className={styles.header__logo} />
        <h1 className={styles.header__title}>TUMLADEN</h1>
      </div>

      <div className={styles.header__right}>
        <button className={styles.header__loginBtn}>Войти</button>
      </div>
    </header>
  )
}

export default Header