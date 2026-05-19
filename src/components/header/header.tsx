import { useState } from 'react';
import styles from './header.module.scss';
import logo from '@/assets/logo_168x92.png';
import defaultAvatar from '@/assets/elf-avatar.svg';
import { MINIO_URL } from '@/api/config';
import Modal from '../modal/modal';
import { AuthModal } from '../authModal/authModal';
import { LogoutModal } from '../logoutModal/logoutModal'
import { useUserStore } from '@/store/useUserStore';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

function avatarSrc(url?: string | null): string {
  if (!url) return defaultAvatar;
  if (url.startsWith('http')) return url;
  return `${MINIO_URL}${url}`;
}

function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogOutOpen, setIsLogOutOpen] = useState(false);
  const { isAuthenticated, actor } = useUserStore();
  const [authCloseAttempt, setAuthCloseAttempt] = useState(0);

  const handleOpenAuth = () => {
    setAuthCloseAttempt(0); 
    setIsAuthOpen(true);
  };

  const handleBackdropClick = () => {
    setAuthCloseAttempt(prev => prev + 1);
  };

  const handleFinalClose = () => {
    setIsAuthOpen(false);
    setAuthCloseAttempt(0);
  };

  return (
    <header className={styles.header}>
      <div className={styles.header__left} onClick={() => window.location.href = '/'}>
        <img src={logo} alt="Tumladen Logo" className={styles.header__logo} />
        <h1 className={styles.header__title}>TUMLADEN</h1>
      </div>

      <div className={styles.header__right}>
        {isAuthenticated && actor ? (
          <div className={styles.header__profile}>
            <Link
              to={`/profile/${actor.id}`}
              className={styles.header__profileLink}
            >
              <span style={{ fontWeight: 600 }}>{actor.displayName}</span>
              <img
                src={avatarSrc(actor.avatarUrl)}
                alt={actor.displayName}
                className={styles.header__avatar}
              />
            </Link>
            <button
              className={styles.header__loginBtn}
              onClick={() => setIsLogOutOpen(true)}
              style={{ padding: '8px', display: 'flex' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            className={styles.header__loginBtn} 
            onClick={handleOpenAuth}
          >
            Войти
          </button>
        )}
      </div>

      <Modal isOpen={isAuthOpen} onClose={handleBackdropClick}>
        <AuthModal 
          onSuccess={handleFinalClose} 
          closeAttemptTrigger={authCloseAttempt}
          onConfirmClose={handleFinalClose} />
      </Modal>
      
      <Modal isOpen={isLogOutOpen} onClose={() => setIsLogOutOpen(false)}>
        <LogoutModal onClose={() => setIsLogOutOpen(false)} />
      </Modal>
    </header>
  );
}

export default Header;