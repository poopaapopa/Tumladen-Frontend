import { MousePointerClick } from 'lucide-react';
import clsx from 'clsx';
import styles from '../carcassonneRules.module.scss';
import { RuleImage } from '@/components/gameRules/ruleImage';
import { Meeple3D } from '@/components/gameRoom/matchPlayerCard/meeple3D';
import { PLAYER_PALETTE } from '@/utils/playerColor';

import tavernTileImg from '@/assets/rules/tiles/tavern-96.webp?no-inline';
import tavernTileImg2x from '@/assets/rules/tiles/tavern-192.webp';
import cathedralTileImg from '@/assets/rules/tiles/cathedral-96.webp?no-inline';
import cathedralTileImg2x from '@/assets/rules/tiles/cathedral-192.webp';
import innRoadRulesImg from '@/assets/rules/illustrations/inn-road-rules.webp';
import innRoadRulesImg360 from '@/assets/rules/illustrations/inn-road-rules-360.webp';
import cathedralCityRulesImg from '@/assets/rules/illustrations/cathedral-city-rules.webp';
import cathedralCityRulesImg360 from '@/assets/rules/illustrations/cathedral-city-rules-360.webp';
import bigMeepleCityRulesImg from '@/assets/rules/illustrations/big-meeple-city-rules.webp';
import bigMeepleCityRulesImg360 from '@/assets/rules/illustrations/big-meeple-city-rules-360.webp';
import bigMeepleSelectionRulesImg from '@/assets/rules/illustrations/big-meeple-selection-rules.webp';
import bigMeepleSelectionRulesImg360 from '@/assets/rules/illustrations/big-meeple-selection-rules-360.webp';
import fourCitiesTileRulesImg from '@/assets/rules/tiles/four-cities-tile-rules.webp';
import fourCitiesTileRulesImg128 from '@/assets/rules/tiles/four-cities-tile-rules-128.webp';
import monasteryTwoRoadsTileRulesImg from '@/assets/rules/tiles/monastery-two-roads-tile-rules.webp';
import monasteryTwoRoadsTileRulesImg128 from '@/assets/rules/tiles/monastery-two-roads-tile-rules-128.webp';
import threeRoadsInnTileRulesImg from '@/assets/rules/tiles/three-roads-inn-tile-rules.webp';
import threeRoadsInnTileRulesImg128 from '@/assets/rules/tiles/three-roads-inn-tile-rules-128.webp';
import fieldBoundaryTileRulesImg from '@/assets/rules/tiles/field-boundary-tile-rules.webp';
import fieldBoundaryTileRulesImg256 from '@/assets/rules/tiles/field-boundary-tile-rules-256.webp';
import shortRoadBoundariesTileRulesImg from '@/assets/rules/tiles/short-road-boundaries-tile-rules.webp';
import shortRoadBoundariesTileRulesImg128 from '@/assets/rules/tiles/short-road-boundaries-tile-rules-128.webp';

const TILE_IMAGE_SIZES = '(max-width: 768px) 72px, 90px';
const ROAD_ILLUSTRATION_IMAGE_SIZES = '(max-width: 768px) 325px, 325px';
const CITY_ILLUSTRATION_IMAGE_SIZES = '(max-width: 768px) 400px, 380px';
const MEEPLE_CITY_IMAGE_SIZES = '(max-width: 768px) 400px, 325px';
const SELECTION_HINT_IMAGE_SIZES = '(max-width: 560px) 340px, 300px';
const NEW_TILE_IMAGE_SIZES = '(max-width: 420px) 72px, 96px';
const FIELD_BOUNDARY_IMAGE_SIZES = '(max-width: 420px) 260px, 210px';

const NEW_TILE_RULES = [
  {
    id: 'four-cities',
    description: (
      <>
        На этом квадрате местности изображены{' '}
        <strong>4 участка 4 разных городов</strong> и полем между ними.
      </>
    ),
    src: fourCitiesTileRulesImg128,
    srcSet: `${fourCitiesTileRulesImg128} 128w, ${fourCitiesTileRulesImg} 256w`,
    width: 256,
    height: 256,
    sizes: NEW_TILE_IMAGE_SIZES,
    alt: 'Квадрат с четырьмя не соединёнными участками города',
  },
  {
    id: 'monastery-roads',
    description: (
      <>
        Монастырь прерывает дорогу. Левый и правый участки считаются{' '}
        <strong>двумя разными дорогами</strong>.
      </>
    ),
    src: monasteryTwoRoadsTileRulesImg128,
    srcSet: `${monasteryTwoRoadsTileRulesImg128} 128w, ${monasteryTwoRoadsTileRulesImg} 256w`,
    width: 256,
    height: 256,
    sizes: NEW_TILE_IMAGE_SIZES,
    alt: 'Квадрат с монастырём между двумя отдельными дорогами',
  },
  {
    id: 'three-roads',
    description: (
      <>
        Таверна относится только к дорогам, <strong>уходящим влево и вправо</strong>.{' '}
        Нижняя дорога остаётся без бонуса таверны.
      </>
    ),
    src: threeRoadsInnTileRulesImg128,
    srcSet: `${threeRoadsInnTileRulesImg128} 128w, ${threeRoadsInnTileRulesImg} 256w`,
    width: 256,
    height: 256,
    sizes: NEW_TILE_IMAGE_SIZES,
    alt: 'Квадрат с тремя дорогами и таверной только у двух из них',
  },
  {
    id: 'short-roads',
    description: (
      <>
        Вы не можете выставить разбойника на короткие дороги, ведущие к городам.
        Эти дороги служат границами полей.
      </>
    ),
    src: shortRoadBoundariesTileRulesImg128,
    srcSet: `${shortRoadBoundariesTileRulesImg128} 128w, ${shortRoadBoundariesTileRulesImg} 256w`,
    width: 256,
    height: 256,
    sizes: NEW_TILE_IMAGE_SIZES,
    alt: 'Квадрат с двумя городами, кустами и отмеченными короткими участками у ворот',
  },
  {
    id: 'field-boundary',
    description: (
      <>
        Граница полей, изображённых на этих квадратах, пролегает в месте, обозначенном стрелкой.
      </>
    ),
    src: fieldBoundaryTileRulesImg256,
    srcSet: `${fieldBoundaryTileRulesImg256} 256w, ${fieldBoundaryTileRulesImg} 516w`,
    width: 516,
    height: 256,
    sizes: FIELD_BOUNDARY_IMAGE_SIZES,
    alt: 'Два соседних квадрата со стрелкой, указывающей точку соприкосновения полей',
  },
] as const;

const InnsAndCathedralsRules = () => (
  <div className={styles.rules}>
    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Состав дополнения</h2>
      <ul className={styles.rules__list}>
        <li>
          <span className={styles.rules__highlight}>18 новых квадратов</span>{' '}
          местности. В том числе:
          <ul className={styles.rules__list}>
            <li><span className={styles.rules__highlight}>6 квадратов</span> с таверной</li>
            <li><span className={styles.rules__highlight}>2 квадрата</span> с собором</li>
          </ul>

          <div className={styles.rules__tileShowcase}>
            <div className={styles.rules__tileCard}>
              <RuleImage
                src={tavernTileImg}
                srcSet={`${tavernTileImg} 96w, ${tavernTileImg2x} 192w`}
                sizes={TILE_IMAGE_SIZES}
                width={96}
                height={96}
                loading="eager"
                alt="Квадрат местности с таверной у дороги"
                className={styles.rules__tileImg}
              />
              <span className={styles.rules__tileLabel}>Таверна</span>
            </div>

            <div className={styles.rules__tileCard}>
              <RuleImage
                src={cathedralTileImg}
                srcSet={`${cathedralTileImg} 96w, ${cathedralTileImg2x} 192w`}
                sizes={TILE_IMAGE_SIZES}
                width={96}
                height={96}
                loading="eager"
                alt="Квадрат местности с собором"
                className={styles.rules__tileImg}
              />
              <span className={styles.rules__tileLabel}>Собор</span>
            </div>
          </div>
        </li>

        <li>
          <span className={styles.rules__highlight}>6 крупных подданных</span> разных цветов{' '}
          <span className={styles.rules__meeplePalette}>
            {PLAYER_PALETTE.map((color) => (
              <Meeple3D
                key={color}
                color={color}
                size={40}
                className={styles.rules__inlineMeeple}
                variant="standing"
              />
            ))}
          </span>
        </li>
      </ul>
    </section>

    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Подсчёт очков за дорогу с таверной</h2>

      <div className={clsx(
        styles.rules__expansionIllustrated,
        styles.rules__expansionIllustratedRoad,
      )}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Каждый квадрат с участком завершённой дороги с{' '}
            <strong>одной или несколькими тавернами</strong> приносит{' '}
            <strong>2 очка</strong> (вместо 1).
          </p>
          <p className={styles.rules__text}>
            Но если <strong>до конца игры вы не завершите</strong> такую дорогу, то при
            финальном подсчёте очков вы <strong>не получите очков</strong> за неё.
          </p>
        </div>

        <figure className={clsx(
          styles.rules__illustrationFigure,
          styles.rules__expansionIllustrationFigure,
          styles.rules__expansionIllustrationFigureRoad,
        )}>
          <RuleImage
            src={innRoadRulesImg360}
            srcSet={`${innRoadRulesImg360} 360w, ${innRoadRulesImg} 800w`}
            sizes={ROAD_ILLUSTRATION_IMAGE_SIZES}
            width={800}
            height={536}
            fetchPriority="low"
            alt="Завершённая дорога из четырёх разных квадратов с поворотом и двумя тавернами"
            className={clsx(
              styles.rules__illustration,
              styles.rules__expansionIllustration,
            )}
          />
          <figcaption className={clsx(
            styles.rules__illustrationCaption,
            styles.rules__expansionIllustrationCaption,
          )}>
            Несмотря на то, что у принадлежащей синему игроку завершённой
            дороги стоит 2 таверны, он всё равно получает за неё{' '}
            <strong>8 очков</strong>.
          </figcaption>
        </figure>
      </div>
    </section>

    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Подсчёт очков за город с собором</h2>

      <div className={clsx(
        styles.rules__expansionIllustrated,
        styles.rules__expansionIllustratedCity,
      )}>
        <figure className={clsx(
          styles.rules__illustrationFigure,
          styles.rules__expansionIllustrationFigure,
          styles.rules__expansionIllustrationFigureCity,
        )}>
          <RuleImage
            src={cathedralCityRulesImg360}
            srcSet={`${cathedralCityRulesImg360} 360w, ${cathedralCityRulesImg} 800w`}
            sizes={CITY_ILLUSTRATION_IMAGE_SIZES}
            width={800}
            height={600}
            fetchPriority="low"
            alt="Завершённый город из семи разных квадратов с одним собором и двумя щитами"
            className={clsx(
              styles.rules__illustration,
              styles.rules__expansionIllustration,
            )}
          />
          <figcaption className={clsx(
            styles.rules__illustrationCaption,
            styles.rules__expansionIllustrationCaption,
          )}>
            Красный игрок получает <strong>3 очка</strong>{' '}
            за каждый из 7 квадратов этого завершённого города (всего 21 очко) и ещё{' '}
            <strong>6</strong> за 2 символа щита, изображённых на них.
            Всего он получает <strong>27 очков</strong>.
          </figcaption>
        </figure>

        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Каждый квадрат завершённого города с{' '}
            <strong>одним или несколькими соборами</strong> приносит{' '}
            <strong>3 очка</strong> (вместо 2). Каждый <strong>символ щита</strong>{' '}
            также приносит <strong>3 очка</strong> (вместо 2).
          </p>
          <p className={styles.rules__text}>
            Но если <strong>до конца игры вы не завершите</strong> город с собором, то при
            финальном подсчёте очков вы <strong>не получите очков</strong> за него.
          </p>
        </div>
      </div>
    </section>

    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Крупный подданный</h2>

      <div className={clsx(
        styles.rules__expansionIllustrated,
        styles.rules__expansionIllustratedMeeple,
      )}>
        <div className={styles.rules__illustratedContent}>
          <p className={styles.rules__text}>
            Крупного подданного можно поставить вместо обычного. При подсчёте очков за
            завершённый объект каждый крупный подданный считается за{' '}
            <span className={styles.rules__highlight}>двух обычных подданных</span>.
            После начисления очков крупные подданные возвращаются в запас своих владельцев
            так же, как и обычные подданные.
          </p>
        </div>

        <figure className={clsx(
          styles.rules__illustrationFigure,
          styles.rules__expansionIllustrationFigure,
          styles.rules__expansionIllustrationFigureMeeple,
        )}>
          <RuleImage
            src={bigMeepleCityRulesImg360}
            srcSet={`${bigMeepleCityRulesImg360} 360w, ${bigMeepleCityRulesImg} 800w`}
            sizes={MEEPLE_CITY_IMAGE_SIZES}
            width={800}
            height={560}
            fetchPriority="low"
            alt="Завершённый город из шести разных квадратов с крупным красным и обычным синим подданными"
            className={clsx(
              styles.rules__illustration,
              styles.rules__expansionIllustration,
            )}
          />
          <figcaption className={clsx(
            styles.rules__illustrationCaption,
            styles.rules__expansionIllustrationCaption,
          )}>
            В завершённом городе находится красный крупный подданный и 1 обычный синий
            подданный. Так как крупный подданный считается за 2 обычных подданных,{' '}
            <strong>красный получает</strong> 12 очков за этот город.
          </figcaption>
        </figure>
      </div>

      <aside className={styles.rules__meepleSelectionHint}>
        <MousePointerClick
          size={20}
          className={styles.rules__meepleSelectionHintIcon}
          aria-hidden="true"
        />
        <div className={styles.rules__meepleSelectionHintContent}>
          <h3 className={styles.rules__meepleSelectionHintTitle}>
            Выбор крупного подданного
          </h3>
          <p className={styles.rules__meepleSelectionHintText}>
            После размещения квадрата нажмите на крупную фигуру в своей карточке игрока.
            Выбранный тип подсветится — после этого выберите доступную область на новом квадрате.
          </p>
        </div>
        <figure className={styles.rules__meepleSelectionHintFigure}>
          <RuleImage
            src={bigMeepleSelectionRulesImg360}
            srcSet={`${bigMeepleSelectionRulesImg360} 360w, ${bigMeepleSelectionRulesImg} 720w`}
            sizes={SELECTION_HINT_IMAGE_SIZES}
            width={720}
            height={180}
            alt="Крупный красный подданный подсвечен в ряду фигур на карточке игрока"
            className={styles.rules__meepleSelectionHintImage}
          />
        </figure>
      </aside>
    </section>

    <section className={styles.rules__section}>
      <h2 className={styles.rules__heading}>Новые квадраты местности</h2>

      <ul className={styles.rules__newTilesGrid}>
        {NEW_TILE_RULES.map((rule) => (
          <li
            key={rule.id}
            className={clsx(
              styles.rules__newTileCard,
              rule.id === 'field-boundary' && styles.rules__newTileCard_pair,
            )}
          >
            <figure className={clsx(
              styles.rules__newTileVisual,
              rule.id === 'field-boundary' && styles.rules__newTileVisual_pair,
            )}>
              <RuleImage
                src={rule.src}
                srcSet={rule.srcSet}
                sizes={rule.sizes}
                width={rule.width}
                height={rule.height}
                alt={rule.alt}
                className={styles.rules__newTileImage}
              />
            </figure>
            <div className={styles.rules__newTileContent}>
              <p className={styles.rules__newTileText}>{rule.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default InnsAndCathedralsRules;
