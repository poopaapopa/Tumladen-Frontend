import { useState } from 'react';
import styles from './header.module.scss';
import logo from '@/assets/logo_168x92.png';
import Modal from '../modal/modal';
import { AuthModal } from '../authModal/authModal';
import {LogoutModal} from '../logoutModal/logoutModal'
import { useUserStore } from '@/store/useUserStore';
import { LogOut, User } from 'lucide-react';

function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogOutOpen, setIsLogOutOpen] = useState(false);
  const { isAuthenticated, actor } = useUserStore();

  return (
    <header className={styles.header}>
      <div className={styles.header__left} onClick={() => window.location.href = '/'}>
        <img src={logo} alt="Tumladen Logo" className={styles.header__logo} />
        <h1 className={styles.header__title}>TUMLADEN</h1>
      </div>

      <div className={styles.header__right}>
        {isAuthenticated && actor ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5F5DC' }}>
              <User size={20} />
              <span style={{ fontWeight: 600 }}>{actor.displayName}</span>
            </div>
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
            onClick={() => setIsAuthOpen(true)}
          >
            Войти
          </button>
        )}
      </div>

      <Modal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)}>
        <AuthModal onSuccess={() => setIsAuthOpen(false)} />
      </Modal>
      
      <Modal isOpen={isLogOutOpen} onClose={() => setIsLogOutOpen(false)}>
        <LogoutModal onClose={() => setIsLogOutOpen(false)} />
      </Modal>
    </header>
  );
}

export default Header;