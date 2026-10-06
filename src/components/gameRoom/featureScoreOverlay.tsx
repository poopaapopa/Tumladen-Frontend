import { useEffect, useMemo, useRef } from 'react';
import { Circle, Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { FeatureScoredEvent, Tile } from '@/types/match';
import { getPlayerColorBySeat } from '@/utils/playerColor';
import { getZoneOffset } from '@/utils/tileZones';
import { getScoreEventDisplayMs } from './scoreEventTiming';
import { getCityHighlightColor } from './cityHighlightColors';

interface ScoreOverlayPlayer {
  actorId: string;
  seat: number;
}

interface FeatureScoreOverlayProps {
  event: FeatureScoredEvent;
  board: Tile[];
  players: ScoreOverlayPlayer[];
  stageScale: number;
  tileSize: number;
  tileStep: number;
}

interface AnimatedScoreProps {
  x: number;
  startY: number;
  endY: number;
  text: string;
  color: string;
  fontSize: number;
  contentScale: number;
}

interface ScoreRenderItem {
  key: string;
  actorId: string;
  points: number;
  tile: Tile;
  zoneId?: string;
  markerAnchored: boolean;
  overlapIndex: number;
  overlapCount: number;
}

interface CityHighlight {
  key: string;
  number: number;
  color: string;
  tiles: Tile[];
  anchorTile?: Tile;
  anchorZoneId: string;
}

const NORMAL_SCORE_ENTER_MS = 200;
const NORMAL_SCORE_RISE_MS = 1650;
const NORMAL_SCORE_VISUAL_END_OFFSET_MS = 560;
const SCORE_MAX_HEIGHT_RATIO = 0.36;
const SCORE_TILE_PADDING_RATIO = 0.08;

const formatPoints = (points: number): string => (
  points > 0 ? `+${points}` : `${points}`
);

const scoreTextWidth = (text: string, fontSize: number): number => (
  Math.max(68, text.length * fontSize * 0.72)
);

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

const AnimatedScore = ({
  x,
  startY,
  endY,
  text,
  color,
  fontSize,
  contentScale,
}: AnimatedScoreProps) => {
  const motionRef = useRef<Konva.Group | null>(null);
  const scaleRef = useRef<Konva.Group | null>(null);
  const width = scoreTextWidth(text, fontSize);
  const height = fontSize * 1.45;

  useEffect(() => {
    const motionNode = motionRef.current;
    const scaleNode = scaleRef.current;
    if (!motionNode || !scaleNode) return;

    motionNode.y(startY);
    scaleNode.scale({ x: 0.78, y: 0.78 });

    const enterTween = new Konva.Tween({
      node: scaleNode,
      duration: NORMAL_SCORE_ENTER_MS / 1000,
      scaleX: 1,
      scaleY: 1,
      easing: Konva.Easings.EaseOut,
    });
    enterTween.play();

    let riseTween: Konva.Tween | null = null;
    const riseTimer = window.setTimeout(() => {
      riseTween = new Konva.Tween({
        node: motionNode,
        duration: NORMAL_SCORE_RISE_MS / 1000,
        y: endY,
        easing: Konva.Easings.EaseOut,
      });
      riseTween.play();
    }, NORMAL_SCORE_ENTER_MS);

    return () => {
      window.clearTimeout(riseTimer);
      enterTween.destroy();
      riseTween?.destroy();
    };
  }, [endY, startY]);

  return (
    <Group x={x} listening={false}>
      <Group ref={motionRef} listening={false}>
        <Group
          scaleX={contentScale}
          scaleY={contentScale}
          listening={false}
        >
          <Group ref={scaleRef} listening={false}>
            <Text
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              text={text}
              align="center"
              verticalAlign="middle"
              fontFamily="Arial, sans-serif"
              fontSize={fontSize}
              fontStyle="bold"
              fill={color}
              stroke="rgba(18, 14, 10, 0.9)"
              strokeWidth={2.5}
              fillAfterStrokeEnabled
              shadowColor={color}
              shadowBlur={9}
              shadowOpacity={0.72}
              shadowOffsetY={1}
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        </Group>
      </Group>
    </Group>
  );
};

interface CityHighlightsProps {
  cities: CityHighlight[];
  tileSize: number;
  tileStep: number;
  displayDurationMs: number;
}

const CityHighlights = ({
  cities,
  tileSize,
  tileStep,
  displayDurationMs,
}: CityHighlightsProps) => {
  const groupRef = useRef<Konva.Group | null>(null);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    node.opacity(0);
    const enterTween = new Konva.Tween({
      node,
      duration: 0.18,
      opacity: 0.85,
      easing: Konva.Easings.EaseOut,
    });
    enterTween.play();

    let fadeTween: Konva.Tween | null = null;
    const fadeStartMs = Math.max(200, displayDurationMs - 900);
    const visualEndMs = displayDurationMs - 120;
    const fadeTimer = window.setTimeout(() => {
      fadeTween = new Konva.Tween({
        node,
        duration: Math.max(100, visualEndMs - fadeStartMs) / 1000,
        opacity: 0,
        easing: Konva.Easings.EaseInOut,
      });
      fadeTween.play();
    }, fadeStartMs);

    return () => {
      window.clearTimeout(fadeTimer);
      enterTween.destroy();
      fadeTween?.destroy();
    };
  }, [displayDurationMs]);

  return (
    <Group ref={groupRef} listening={false}>
      {cities.map((city) => {
        const anchorOffset = city.anchorTile
          ? getZoneOffset(
              city.anchorTile.tileId,
              city.anchorZoneId,
              city.anchorTile.rotation,
            )
          : { x: 0, y: 0 };
        const offsetScale = tileSize / 150;

        return (
          <Group key={city.key} listening={false}>
            {city.tiles.map((tile) => (
              <Rect
                key={`${city.key}:${tile.instanceId}`}
                x={tile.x * tileStep - tileSize / 2 + 3}
                y={tile.y * tileStep - tileSize / 2 + 3}
                width={tileSize - 6}
                height={tileSize - 6}
                cornerRadius={9}
                stroke={city.color}
                strokeWidth={4}
                dash={[10, 6]}
                shadowColor={city.color}
                shadowBlur={12}
                shadowOpacity={0.8}
                strokeScaleEnabled={false}
                listening={false}
                perfectDrawEnabled={false}
              />
            ))}

            {city.anchorTile && (
              <Group
                x={city.anchorTile.x * tileStep + anchorOffset.x * offsetScale}
                y={city.anchorTile.y * tileStep + anchorOffset.y * offsetScale}
                listening={false}
              >
                <Circle
                  radius={15}
                  fill={city.color}
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth={2}
                  shadowColor="rgba(0, 0, 0, 0.65)"
                  shadowBlur={7}
                  shadowOffsetY={2}
                  listening={false}
                />
                <Text
                  x={-15}
                  y={-9}
                  width={30}
                  height={18}
                  text={`${city.number}`}
                  align="center"
                  verticalAlign="middle"
                  fill="#211b13"
                  fontFamily="Arial, sans-serif"
                  fontSize={15}
                  fontStyle="bold"
                  listening={false}
                />
              </Group>
            )}
          </Group>
        );
      })}
    </Group>
  );
};

export const FeatureScoreOverlay = ({
  event,
  board,
  players,
  stageScale,
  tileSize,
  tileStep,
}: FeatureScoreOverlayProps) => {
  const scoresOpacityRef = useRef<Konva.Group | null>(null);
  const tileByInstanceId = useMemo(
    () => new Map(board.flatMap((tile) => (
      tile.instanceId ? [[tile.instanceId, tile] as const] : []
    ))),
    [board],
  );
  const playerByActorId = useMemo(
    () => new Map(players.map((player) => [player.actorId, player])),
    [players],
  );
  const scoreItems = useMemo<ScoreRenderItem[]>(() => {
    const rawItems: Array<Omit<ScoreRenderItem, 'overlapIndex' | 'overlapCount'> & {
      overlapKey: string;
    }> = [];
    const markers = event.payload.scoreMarkers;

    if (Array.isArray(markers)) {
      markers.forEach((marker, markerIndex) => {
        const tile = tileByInstanceId.get(marker.tileInstanceId);
        if (!tile) return;
        rawItems.push({
          key: `${event.id}:marker:${marker.actorId}:${marker.tileInstanceId}:${marker.zoneId}:${markerIndex}`,
          actorId: marker.actorId,
          points: marker.points,
          tile,
          zoneId: marker.zoneId,
          markerAnchored: true,
          overlapKey: `${marker.tileInstanceId}:${marker.zoneId}`,
        });
      });
    } else {
      event.payload.contributions.forEach((contribution, contributionIndex) => {
        const tile = tileByInstanceId.get(contribution.tileInstanceId);
        if (!tile) return;
        event.payload.awards.forEach((award, awardIndex) => {
          rawItems.push({
            key: `${event.id}:contribution:${contributionIndex}:${award.actorId}:${awardIndex}`,
            actorId: award.actorId,
            points: contribution.points,
            tile,
            markerAnchored: false,
            overlapKey: `contribution:${contributionIndex}`,
          });
        });
      });
    }

    const counts = new Map<string, number>();
    rawItems.forEach((item) => {
      counts.set(item.overlapKey, (counts.get(item.overlapKey) ?? 0) + 1);
    });
    const indices = new Map<string, number>();

    return rawItems.map(({ overlapKey, ...item }) => {
      const overlapIndex = indices.get(overlapKey) ?? 0;
      indices.set(overlapKey, overlapIndex + 1);
      return {
        ...item,
        overlapIndex,
        overlapCount: counts.get(overlapKey) ?? 1,
      };
    });
  }, [event, tileByInstanceId]);
  const highlightedCities = useMemo<CityHighlight[]>(() => {
    return (event.payload.contributingCities ?? []).map((city, index) => ({
      key: `${city.anchorTileInstanceId}:${city.anchorZoneId}`,
      number: index + 1,
      color: getCityHighlightColor(index),
      tiles: city.tileInstanceIds.flatMap((tileId) => {
        const tile = tileByInstanceId.get(tileId);
        return tile ? [tile] : [];
      }),
      anchorTile: tileByInstanceId.get(city.anchorTileInstanceId),
      anchorZoneId: city.anchorZoneId,
    }));
  }, [event.payload.contributingCities, tileByInstanceId]);
  const maxOverlapCount = Math.max(
    1,
    ...scoreItems.map((item) => item.overlapCount),
  );
  const fontSize = maxOverlapCount <= 1 ? 32 : maxOverlapCount === 2 ? 28 : 23;
  const spacing = maxOverlapCount <= 2 ? 42 : 31;
  const textHeight = fontSize * 1.45;
  const contentScale = Math.min(
    1 / Math.max(stageScale, 0.01),
    (tileSize * SCORE_MAX_HEIGHT_RATIO) / textHeight,
  );
  const verticalInset = tileSize * SCORE_TILE_PADDING_RATIO
    + textHeight * contentScale / 2;
  const tileTopY = -tileSize / 2 + verticalInset;
  const tileBottomY = tileSize / 2 - verticalInset;
  const displayDurationMs = getScoreEventDisplayMs(event);

  useEffect(() => {
    const node = scoresOpacityRef.current;
    if (!node) return;

    const visualEndMs = displayDurationMs - NORMAL_SCORE_VISUAL_END_OFFSET_MS;
    const fadeStartMs = NORMAL_SCORE_ENTER_MS + 100;

    node.opacity(0);
    const enterTween = new Konva.Tween({
      node,
      duration: NORMAL_SCORE_ENTER_MS / 1000,
      opacity: 1,
      easing: Konva.Easings.EaseOut,
    });
    enterTween.play();

    let fadeTween: Konva.Tween | null = null;
    const fadeTimer = window.setTimeout(() => {
      // Все числа события начинают затухание из одной и той же непрозрачности.
      node.opacity(1);
      fadeTween = new Konva.Tween({
        node,
        duration: Math.max(100, visualEndMs - fadeStartMs) / 1000,
        opacity: 0,
        easing: Konva.Easings.EaseIn,
      });
      fadeTween.play();
    }, fadeStartMs);

    return () => {
      window.clearTimeout(fadeTimer);
      enterTween.destroy();
      fadeTween?.destroy();
    };
  }, [displayDurationMs, event.id]);

  return (
    <Group listening={false}>
      {highlightedCities.length > 0 && (
        <CityHighlights
          key={event.id}
          cities={highlightedCities}
          tileSize={tileSize}
          tileStep={tileStep}
          displayDurationMs={displayDurationMs}
        />
      )}

      <Group ref={scoresOpacityRef} listening={false}>
        {scoreItems.map((item) => {
          const text = formatPoints(item.points);
          const horizontalOffset = (
            item.overlapIndex - (item.overlapCount - 1) / 2
          ) * spacing * contentScale;
          const zoneOffset = item.markerAnchored && item.zoneId
            ? getZoneOffset(item.tile.tileId, item.zoneId, item.tile.rotation)
            : { x: 0, y: 0 };
          const textHalfWidth = scoreTextWidth(text, fontSize) * contentScale / 2;
          const horizontalInset = tileSize * SCORE_TILE_PADDING_RATIO + textHalfWidth;
          const minX = -tileSize / 2 + horizontalInset;
          const maxX = tileSize / 2 - horizontalInset;
          const relativeX = clamp(
            zoneOffset.x + horizontalOffset,
            Math.min(minX, maxX),
            Math.max(minX, maxX),
          );

          let startY = tileBottomY;
          let endY = tileTopY;
          if (item.markerAnchored) {
            const markerY = clamp(zoneOffset.y, tileTopY, tileBottomY);
            const desiredTravel = Math.min(tileSize * 0.55, tileBottomY - tileTopY);
            const minimumTravel = Math.min(tileSize * 0.42, tileBottomY - tileTopY);
            endY = Math.max(tileTopY, markerY - desiredTravel);
            startY = markerY;
            if (startY - endY < minimumTravel) {
              startY = Math.min(tileBottomY, endY + minimumTravel);
            }
          }

          const player = playerByActorId.get(item.actorId);
          return (
            <AnimatedScore
              key={item.key}
              x={item.tile.x * tileStep + relativeX}
              startY={item.tile.y * tileStep + startY}
              endY={item.tile.y * tileStep + endY}
              text={text}
              color={getPlayerColorBySeat(player?.seat)}
              fontSize={fontSize}
              contentScale={contentScale}
            />
          );
        })}
      </Group>
    </Group>
  );
};
