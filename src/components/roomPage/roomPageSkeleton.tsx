import { Skeleton } from '../skeleton/skeleton.tsx';
import pageStyles from './roomPage.module.scss';
import sidebarStyles from '../roomSidebar/roomSidebar.module.scss';
import playerStyles from '../playerSlot/playerSlot.module.scss';

export const RoomPageSkeleton = () => {
  return (
    <div className={pageStyles.roomPage}>
      <aside className={sidebarStyles.roomSidebar}>
        <div className={sidebarStyles.roomSidebar__header}>
          <div className={sidebarStyles.roomSidebar__nameContainer}>
             <Skeleton width="220px" height="38px" />
          </div>
          <Skeleton width="100px" height="18px" style={{ marginTop: '6px' }} />
        </div>

        <div className={sidebarStyles.roomSidebar__configGrid}>
          <Skeleton width="100%" height="50px" style={{ borderRadius: '12px' }} />
          <Skeleton width="100%" height="50px" style={{ borderRadius: '12px' }} />
        </div>

        <div style={{ marginTop: 'auto' }}>
           <Skeleton width="100%" height="99px" style={{ borderRadius: '12px' }} />
        </div>
      </aside>

      <main className={pageStyles.roomPage__main}>
        <div style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
          <Skeleton width="100%" height="350px" style={{ borderRadius: '20px' }} />
          <Skeleton
            width="80%"
            height="60px"
            style={{ margin: '20px auto 0', display: 'block' }}
          />
        </div>
      </main>

      <section className={pageStyles.roomPage__players}>
        <Skeleton width="150px" height="29px" style={{ marginBottom: '18px' }} />

        <div className={pageStyles.roomPage__playerList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={playerStyles.playerSlot} style={{ opacity: 0.6 }}>
              <div className={playerStyles.playerSlot__playerInfo}>
                <Skeleton variant="circle" width="20px" height="20px" />
                <Skeleton width="120px" height="22px" style={{ marginLeft: '15px' }} />
              </div>
              <Skeleton variant="circle" width="20px" height="20px" />
            </div>
          ))}
        </div>

        <div className={pageStyles.roomPage__actions} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="100%" height="49px" style={{ borderRadius: '12px' }} />
          <Skeleton width="100%" height="49px" style={{ borderRadius: '12px' }} />
        </div>
      </section>
    </div>
  );
};