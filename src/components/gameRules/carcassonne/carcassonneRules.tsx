import { Lightbulb, Star } from 'lucide-react';
import styles from './carcassonneRules.module.scss';
import { Meeple3D } from '@/components/gameRoom/matchPlayerCard/meeple';

// Tile images for game entity examples
import cityGateImg from '@/assets/tiles/city_gate.webp';
import roadStraightImg from '@/assets/tiles/road_straight.webp';
import monasteryImg from '@/assets/tiles/monastery.webp';
import startTileImg from '@/assets/tiles/start_tile.webp';

// Placeholder illustrations (elf images — will be replaced with real game screenshots)
import elfGameImg from '@/assets/elf-game.png';
import elfCampfireImg from '@/assets/elf-campfire.png';
import elfMountainsImg from '@/assets/elf-mountains.png';
import elfLeavesImg from '@/assets/elf-leaves.png';
import elfExileImg from '@/assets/elf-exile.png';

const MEEPLE_COLORS = ['#E8302A', '#2E6FE8', '#27C75A', '#F5C518', '#A83FE8'];

const CarcassonneRules = () => (
  <div className={styles.rules}>
    {/* ─── 1. Overview ─── */}
    <section className={styles.rules__section}>
      <p className={styles.rules__text}>
        <strong>Fortresses &amp; Roads</strong> — стратегия для 2–5 игроков.
        Вы — средневековый феодал, осваивающий новые земли. По очереди выкладывайте
        квадраты местности, возводите города, прокладывайте дороги, основывайте монастыри
        и отправляйте подданных на завоёванные территории, чтобы набрать как можно больше очков.
      </p>
    </section>

    {/* ─── 2. Components & Setup ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Состав игры и подготовка</h2>
      <ul className={styles.rules__list}>
        <li><span className={styles.rules__highlight}>72 квадрата</span> местности</li>

        <p className={styles.rules__text}>
          На каждом квадрате могут быть изображены три основных типа объектов:
        </p>

        <div className={styles.rules__tileShowcase}>
          <div className={styles.rules__tileCard}>
            <img src={cityGateImg} alt="Город" className={styles.rules__tileImg} />
            <span className={styles.rules__tileLabel}>Город</span>
          </div>
          <div className={styles.rules__tileCard}>
            <img src={roadStraightImg} alt="Дорога" className={styles.rules__tileImg} />
            <span className={styles.rules__tileLabel}>Дорога</span>
          </div>
          <div className={styles.rules__tileCard}>
            <img src={monasteryImg} alt="Монастырь" className={styles.rules__tileImg} />
            <span className={styles.rules__tileLabel}>Монастырь</span>
          </div>
        </div>

        <li>
          <span className={styles.rules__highlight}>7 подданных</span> на каждого игрока (в цвете игрока){' '}
          {MEEPLE_COLORS.map((color) => (
            <Meeple3D key={color} color={color} size={18} className={styles.rules__inlineMeeple} variant="standing" />
          ))}
        </li>
      </ul>

      <p className={styles.rules__text}>
        В начале игры стартовый квадрат{' '}
        <img src={startTileImg} alt="Стартовый квадрат" className={styles.rules__inlineTile} />
        {' '}размещается в центре игрового поля. Остальные квадраты перемешиваются в закрытую колоду. Каждый игрок получает набор из 7 подданных
        своего цвета.
      </p>
    </section>

    {/* ─── 3. Turn Flow — HTML phases ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Ход игры</h2>
      <p className={styles.rules__text}>
        Игроки ходят по очереди. Каждый ход состоит из трёх фаз:
      </p>

      <div className={styles.rules__phases}>
        {/* Phase 1: Place tile */}
        <div className={styles.rules__phase}>
          <div className={styles.rules__phaseTimeline}>
            <div className={styles.rules__phaseNumber}>1</div>
            <div className={styles.rules__phaseLine} />
          </div>
          <div className={styles.rules__phaseBody}>
            <div className={styles.rules__phaseContent}>
              <h3 className={styles.rules__phaseTitle}>Разместить квадрат</h3>
              <p className={styles.rules__phaseText}>
                Игрок получает квадрат из колоды, выбирает куда из предложенных возможных мест его поставить и как его можно повернуть,
                а затем присоединяет его к уже выложенным на стол.
                При этом кадрат хотя бы одной строн присоединяется к другому квадрату и рисунки на стыке квадратов продолжают друг друга.
              </p>
            </div>
            <div className={styles.rules__phaseImage}>
              <img src={cityGateImg} alt="Размещение квадрата" className={styles.rules__phaseImgInner} />
            </div>
          </div>
        </div>

        {/* Phase 2: Place meeple */}
        <div className={styles.rules__phase}>
          <div className={styles.rules__phaseTimeline}>
            <div className={styles.rules__phaseNumber}>2</div>
            <div className={styles.rules__phaseLine} />
          </div>
          <div className={styles.rules__phaseBody}>
            <div className={styles.rules__phaseContent}>
              <h3 className={styles.rules__phaseTitle}>Поставить подданного</h3>
              <p className={styles.rules__phaseText}>
                Игрок может (но не обязан) поставить одного подданного из своего запаса на только что 
                размещённый квадрат — на город, дорогу, монастырь или поле. Если на выложенном квадрате несколько объектов, 
                можно выбрать, на какой из них ставить подданного. Нельзя ставить 
                подданного на объект, где уже стоит чей-либо подданный.
              </p>
            </div>
            <div className={styles.rules__phaseImage}>
              <div className={styles.rules__meepleSample}>
                <Meeple3D color="#E8302A" size={48} variant="standing" />
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3: Scoring */}
        <div className={styles.rules__phase}>
          <div className={styles.rules__phaseTimeline}>
            <div className={styles.rules__phaseNumber}>3</div>
          </div>
          <div className={styles.rules__phaseBody}>
            <div className={styles.rules__phaseContent}>
              <h3 className={styles.rules__phaseTitle}>Подсчёт очков</h3>
              <p className={styles.rules__phaseText}>
                Игрок получает очки за все объекты, завершённые с помощью выложенного квадрата.
              </p>
            </div>
            <div className={styles.rules__phaseImage}>
              <div className={styles.rules__scoreMock}>
                <span className={styles.rules__scoreMockValue}>
                  +4
                  <Star size={18} strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ─── 4. Roads ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Дороги</h2>

      <div className={styles.rules__illustrated}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Выложив квадрат с дорогой, вы можете выставить на неё одного своего подданного из запаса.
            Подданный, поставленный на дорогу, становится <strong>разбойником</strong>.
          </p>
          <p className={styles.rules__text}>
            Дорога считается <strong>завершённой</strong>, когда оба её конца замкнуты —
            городом, перекрёстком, монастырём или когда дорога образует кольцо.
            Завершённая дорога приносит владельцу (владельцам) по 1 очку за каждый квадрат на котором расположена.
            После завершения разбойник <strong>возвращается</strong> владельцу.
          </p>
        </div>
        <figure className={styles.rules__illustrationFigure}>
          <img
            src={elfGameImg}
            alt="Завершённая дорога из нескольких квадратов с разбойником на одном из них"
            className={styles.rules__illustration}
          />
          <figcaption className={styles.rules__illustrationCaption}>Завершённая дорога с разбойником</figcaption>
        </figure>
      </div>
    </section>

    {/* ─── 5. Cities ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Города</h2>

      <div className={styles.rules__illustrated}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Выложив квадрат с городом, вы можете выставить на него одного своего подданного из запаса.
            Подданный, поставленный в город, становится <strong>рыцарем</strong>.
          </p>
          <p className={styles.rules__text}>
            Город считается <strong>завершённым</strong>, когда он полностью окружён стенами
            (все края города замкнуты). Завершённый город приносит по <strong>2 очка за каждый квадрат</strong>.
            Некоторые квадраты города содержат <strong>герб</strong> (щит) —
            каждый герб приносит дополнительные 2 очка. После завершения рыцарь <strong>возвращается</strong>.
          </p>
        </div>
        <figure className={styles.rules__illustrationFigure}>
          <img
            src={elfCampfireImg}
            alt="Завершённый город из нескольких квадратов с рыцарем и гербом на одном из них"
            className={styles.rules__illustration}
          />
          <figcaption className={styles.rules__illustrationCaption}>Завершённый город с рыцарем</figcaption>
        </figure>
      </div>
    </section>

    {/* ─── 6. Monasteries ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Монастыри</h2>

      <div className={styles.rules__illustrated}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Выложив квадрат с монастырём, вы можете выставить на него одного своего подданного из запаса.
            Подданный, поставленный на монастырь, становится <strong>монахом</strong>.
          </p>
          <p className={styles.rules__text}>
            Монастырь считается <strong>завершённым</strong>, когда все 8 клеток вокруг него
            заполнены квадратами (сетка 3×3 с монастырём в центре).
            Завершённый монастырь приносит <strong>9 очков</strong> (1 за монастырь + 8 за соседние квадраты).
            После завершения монах <strong>возвращается</strong> владельцу.
          </p>
        </div>
        <figure className={styles.rules__illustrationFigure}>
          <img
            src={elfMountainsImg}
            alt="Монастырь в центре сетки 3×3 из квадратов с монахом"
            className={styles.rules__illustration}
          />
          <figcaption className={styles.rules__illustrationCaption}>Завершённый монастырь</figcaption>
        </figure>
      </div>
    </section>

    {/* ─── 7. Fields & Farmers ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Поля и крестьяне</h2>

      <div className={styles.rules__illustrated}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Выложив квадрат с полем, вы можете положить на него одного своего подданного <strong>на бок</strong>.
            Подданный, положенный на поле, становится <strong>крестьянином</strong>.
          </p>
          <p className={styles.rules__text}>
            Крестьяне <strong>не возвращаются</strong> до конца игры — они остаются на поле
            до финального подсчёта. В конце игры крестьянин приносит <strong>3 очка</strong> за
            каждый <strong>завершённый город</strong>, к которому примыкает его поле.
          </p>
        </div>
        <figure className={styles.rules__illustrationFigure}>
          <img
            src={elfLeavesImg}
            alt="Поле с лежащим крестьянином, граничащее с несколькими завершёнными городами"
            className={styles.rules__illustration}
          />
          <figcaption className={styles.rules__illustrationCaption}>Крестьянин на поле</figcaption>
        </figure>
      </div>

      <div className={styles.rules__tip}>
        <Lightbulb size={16} className={styles.rules__tipIcon} />
        <span>
          Крестьяне — ограниченный ресурс! Каждый крестьянин блокирует одного подданного
          на всю партию. Размещайте их осторожно и только когда поле граничит с несколькими
          городами.
        </span>
      </div>
    </section>

    {/* ─── 8. Multiple meeples on one object ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Несколько подданных на одном объекте</h2>

      <div className={styles.rules__illustrated}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Нельзя ставить подданного на объект, на котором <strong>уже стоит</strong> чей-либо
            подданный. Однако при соединении двух отдельных частей объекта (например, двух
            фрагментов города) на нём могут оказаться подданные разных игроков.
          </p>
          <p className={styles.rules__text}>
            В этом случае при завершении объекта очки получает тот, у кого
            <strong> больше подданных</strong> на этом объекте. При равенстве — очки получают
            все участники спора.
          </p>
        </div>
        <figure className={styles.rules__illustrationFigure}>
          <img
            src={elfExileImg}
            alt="Два фрагмента города соединяются в один — на каждом стоит рыцарь разного цвета"
            className={styles.rules__illustration}
          />
          <figcaption className={styles.rules__illustrationCaption}>Спор за объект</figcaption>
        </figure>
      </div>

      <div className={styles.rules__tip}>
        <Lightbulb size={16} className={styles.rules__tipIcon} />
        <span>
          Подданные — ограниченный ресурс! У вас всего 7 штук. Размещайте их
          стратегически и старайтесь завершать объекты, чтобы подданные возвращались.
        </span>
      </div>
    </section>

    {/* ─── 9. End of Game ─── */}
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Конец игры</h2>
      <p className={styles.rules__text}>
        Игра заканчивается, когда размещён последний квадрат из колоды. После этого
        происходит <strong>финальный подсчёт</strong> — очки начисляются за все
        незавершённые объекты, на которых стоят подданные игроков, и за поля:
      </p>

      <table className={styles.rules__scoringTable}>
        <thead>
          <tr>
            <th>Объект</th>
            <th>Во время игры</th>
            <th>В конце игры</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Дорога</td>
            <td>1 за квадрат</td>
            <td>1 за квадрат</td>
          </tr>
          <tr>
            <td>Город</td>
            <td>2 за квадрат + 2 за герб</td>
            <td>1 за квадрат + 1 за герб</td>
          </tr>
          <tr>
            <td>Монастырь</td>
            <td>9</td>
            <td>1 + кол-во соседних квадратов</td>
          </tr>
          <tr>
            <td>Поле</td>
            <td>—</td>
            <td>3 за каждый завершённый город</td>
          </tr>
        </tbody>
      </table>

      <p className={styles.rules__text}>
        Побеждает игрок, набравший наибольшее количество очков. При равенстве очков
        победа делится между игроками.
      </p>
    </section>
  </div>
);

export default CarcassonneRules;
