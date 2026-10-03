import { Skeleton } from '@/components/skeleton/skeleton.tsx';
import { useIsMobile } from '@/hooks/useIsMobile.ts';

import pageStyles from './roomPage.module.scss';
import sidebarStyles from './roomSidebar/roomSidebar.module.scss';
import playersStyles from './roomPlayers/roomPlayers.module.scss';
import playerStyles from './roomPlayers/playerSlot/playerSlot.module.scss';
import styles from './roomPageSkeleton.module.scss';

const RoomSidebarSkeleton = () => (
  <aside className={sidebarStyles.roomSidebar}>
    <div className={sidebarStyles.roomSidebar__header}>
      <div className={sidebarStyles.roomSidebar__nameContainer}>
        <Skeleton width="70%" height="38px" />
      </div>
      <Skeleton width="100px" height="17px" />
    </div>

    <Skeleton className={styles.privacy} width="100%" height="52px" />

    <div className={sidebarStyles.roomSidebar__configGrid}>
      <Skeleton className={styles.configItem} height="52px" />
      <Skeleton className={styles.configItem} height="52px" />
    </div>

    <div className={sidebarStyles.roomSidebar__expansionsSection}>
      <Skeleton width="110px" height="17px" className={styles.expansionsTitle} />
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} width="100%" height="47px" className={styles.expansionRow} />
      ))}
    </div>

    <Skeleton width="100%" className={styles.startButton} />
  </aside>
);

const RoomPlayersSkeleton = () => (
  <section className={playersStyles.roomPlayers}>
    <div className={playersStyles.roomPlayers__title}>
      <Skeleton width="150px" height="29px" />
    </div>

    <div className={playersStyles.roomPlayers__list}>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className={playerStyles.playerSlot}>
          <div className={playerStyles.playerSlot__playerInfo}>
            <Skeleton width="20px" height="20px" />
            <Skeleton width="120px" height="22px" />
          </div>
          <Skeleton variant="circle" width="20px" height="20px" />
        </div>
      ))}
    </div>

    <div className={playersStyles.roomPlayers__actions}>
      <Skeleton width="100%" height="49px" className={styles.playerAction} />
      <Skeleton width="100%" height="49px" className={styles.playerAction} />
    </div>
  </section>
);

const RoomVisualSkeleton = ({ mobile = false }: { mobile?: boolean }) => (
  <>
    <Skeleton className={`${pageStyles.roomPage__visual} ${styles.visual}`} />
    <div className={`${pageStyles.roomPage__gameTitle} ${styles.title}`}>
      <Skeleton
        width={mobile ? '210px' : '75%'}
        height={mobile ? '36px' : '60px'}
        className={styles.gameTitle}
      />
    </div>
  </>
);

const RulesSkeleton = () => (
  <div className={pageStyles.roomPage__rules}>
    <div className={styles.rules}>
      <Skeleton width="100%" height="14px" />
      <Skeleton width="92%" height="14px" />
      <Skeleton width="68%" height="14px" />
      <Skeleton width="210px" height="26px" className={styles.rulesHeading} />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="85%" height="14px" />
    </div>
  </div>
);

const MobileTabsSkeleton = () => (
  <div className={pageStyles.roomPage__mobileTabs}>
    <div className={styles.mobileTabs}>
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className={styles.mobileTab} />
      ))}
    </div>
  </div>
);

export const RoomPageSkeleton = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className={pageStyles.roomPage_mobile}
        aria-busy="true"
        aria-label="Загрузка комнаты"
      >
        <div className={pageStyles.roomPage__mobileHeader}>
          <RoomVisualSkeleton mobile />
        </div>
        <MobileTabsSkeleton />
        <div className={pageStyles.roomPage__mobileBody}>
          <RoomPlayersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={pageStyles.roomPage}
      aria-busy="true"
      aria-label="Загрузка комнаты"
    >
      <RoomSidebarSkeleton />

      <main className={pageStyles.roomPage__main}>
        <RoomVisualSkeleton />
        <RulesSkeleton />
      </main>

      <RoomPlayersSkeleton />
    </div>
  );
};
