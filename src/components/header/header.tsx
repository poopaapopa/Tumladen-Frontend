import { useState } from 'react';
import styles from './header.module.scss';
import logo from '@/assets/logo_168x92.png';
import defaultAvatar from '@/assets/elf-avatar.svg';
import elfLeavesImg from '@/assets/elf-leaves.png';
import { avatarSrc } from '@/utils/avatar.ts';
import Modal from '../modal/modal';
import { AuthModal } from '../authModal/authModal';
import { ConfirmModal } from '../confirmModal/confirmModal';
import { useUserStore } from '@/store/useUserStore';
import { LogOut, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogOutOpen, setIsLogOutOpen] = useState(false);
  const { isAuthenticated, actor, logout } = useUserStore();
  const [authCloseAttempt, setAuthCloseAttempt] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isGuest = isAuthenticated && actor?.type === 'guest';
  const isFullUser = isAuthenticated && actor?.type === 'user';

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

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    setIsLogOutOpen(false);
    navigate('/');
    setTimeout(() => setIsLoggingOut(false), 1000);
  };

  return (
    <header className={styles.header}>
      <div className={styles.header__left} onClick={() => window.location.href = '/'}>
        <img src={logo} alt="Tumladen Logo" className={styles.header__logo} />
        <h1 className={styles.header__title}>TUMLADEN</h1>
      </div>

      <div className={styles.header__right}>
        {isFullUser && actor ? (
          <div className={styles.header__profile}>
            <Link
              to={`/profile/${actor.id}`}
              className={styles.header__profileLink}
            >
              <span style={{ fontWeight: 600 }}>{actor.displayName}</span>
              <img
                src={avatarSrc(actor.avatarUrl) || defaultAvatar}
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
        ) : isGuest && actor ? (
          <div className={styles.header__profile}>
            <div className={styles.header__guestInfo}>
              <span className={styles.header__guestName}>{actor.displayName}</span>
              <span className={styles.header__guestBadge}>Гость</span>
            </div>
            <img
              src={avatarSrc(actor.avatarUrl) || defaultAvatar}
              alt={actor.displayName}
              className={styles.header__avatar}
            />
            <button
              className={styles.header__loginBtn}
              onClick={handleOpenAuth}
            >
              <UserPlus size={18} style={{ marginRight: 6 }} />
              Войти
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
        <ConfirmModal
          title="Хотите выйти из аккаунта?"
          text="Ваши достижения и текущие сессии будут сохранены, но для возвращения в игру потребуется снова войти в аккаунт."
          onConfirm={handleLogout}
          onCancel={() => setIsLogOutOpen(false)}
          onConfirmText="Выйти"
          onCancelText="Остаться"
          image={elfLeavesImg}
        />
      </Modal>
    </header>
  );
}

export default Header;