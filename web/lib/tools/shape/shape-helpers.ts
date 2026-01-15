import { getUniqueChunksFromPoints } from "@/lib/canvas/chunk";
import { AbsolutePoint, absolutePointSchema } from "@/lib/geometry/coord";
import { Rect, rectSchema } from "@/lib/geometry/rect";
import { uuid } from "@/lib/utils/uuid";

import { ACTION_TYPES } from "../../action-types";
import { ColorRef } from "../../palette";
import { getBrushPoints } from "../brush/brush";
import {
  EllipseActive,
  EllipseComplete,
  EllipseFillActive,
  EllipseFillComplete,
  RectangleActive,
  RectangleComplete,
  RectangleFillActive,
  RectangleFillComplete,
} from "./shape-actions";

export function createRect(
  startPoint: AbsolutePoint,
  endPoint: AbsolutePoint,
  constrainToSquare: boolean,
  drawFromCenter: boolean,
): Rect {
  let origin = startPoint;
  let target = endPoint;

  if (drawFromCenter) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    origin = absolutePointSchema.parse({ x: startPoint.x - dx, y: startPoint.y - dy });
    target = endPoint;
  }

  if (constrainToSquare) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    const signX = dx >= 0 ? 1 : -1;
    const signY = dy >= 0 ? 1 : -1;
    target = absolutePointSchema.parse({
      x: origin.x + size * signX,
      y: origin.y + size * signY,
    });
  }

  return rectSchema.parse({ origin, target });
}

function getRectCenter(rect: Rect): AbsolutePoint {
  return absolutePointSchema.parse({
    x: (rect.origin.x + rect.target.x) / 2,
    y: (rect.origin.y + rect.target.y) / 2,
  });
}

function rotatePoint(
  point: AbsolutePoint,
  center: AbsolutePoint,
  angleRadians: number,
): AbsolutePoint {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const x = center.x + dx * cos - dy * sin;
  const y = center.y + dx * sin + dy * cos;
  return absolutePointSchema.parse({ x: Math.round(x), y: Math.round(y) });
}

function rotatePoints(
  points: AbsolutePoint[],
  center: AbsolutePoint,
  angleRadians: number,
): AbsolutePoint[] {
  const rotated: AbsolutePoint[] = [];
  const seen = new Set<string>();
  for (const point of points) {
    const rotatedPoint = rotatePoint(point, center, angleRadians);
    const key = `${rotatedPoint.x},${rotatedPoint.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      rotated.push(rotatedPoint);
    }
  }
  return rotated;
}

function rotatePointFloat(
  point: AbsolutePoint,
  center: AbsolutePoint,
  angleRadians: number,
): { x: number; y: number } {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function getRectBounds(rect: Rect) {
  return {
    minX: Math.min(rect.origin.x, rect.target.x),
    maxX: Math.max(rect.origin.x, rect.target.x),
    minY: Math.min(rect.origin.y, rect.target.y),
    maxY: Math.max(rect.origin.y, rect.target.y),
  };
}

function getRotatedRectBounds(
  rect: Rect,
  center: AbsolutePoint,
  angleRadians: number,
  padding = 0,
) {
  const { minX, maxX, minY, maxY } = getRectBounds(rect);
  const corners = [
    absolutePointSchema.parse({ x: minX, y: minY }),
    absolutePointSchema.parse({ x: maxX, y: minY }),
    absolutePointSchema.parse({ x: maxX, y: maxY }),
    absolutePointSchema.parse({ x: minX, y: maxY }),
  ];

  let boundsMinX = Infinity;
  let boundsMaxX = -Infinity;
  let boundsMinY = Infinity;
  let boundsMaxY = -Infinity;

  for (const corner of corners) {
    const rotated = rotatePointFloat(corner, center, angleRadians);
    boundsMinX = Math.min(boundsMinX, rotated.x);
    boundsMaxX = Math.max(boundsMaxX, rotated.x);
    boundsMinY = Math.min(boundsMinY, rotated.y);
    boundsMaxY = Math.max(boundsMaxY, rotated.y);
  }

  return {
    minX: Math.floor(boundsMinX - padding),
    maxX: Math.ceil(boundsMaxX + padding),
    minY: Math.floor(boundsMinY - padding),
    maxY: Math.ceil(boundsMaxY + padding),
  };
}

function getRotatedRectanglePoints(
  rect: Rect,
  center: AbsolutePoint,
  angleRadians: number,
  lineWidth: number,
  filled: boolean,
): AbsolutePoint[] {
  const { minX, maxX, minY, maxY } = getRectBounds(rect);
  const padding = Math.max(0, lineWidth);
  const bounds = getRotatedRectBounds(rect, center, angleRadians, padding);
  const points: AbsolutePoint[] = [];
  const seen = new Set<string>();

  for (let x = bounds.minX; x <= bounds.maxX; x++) {
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      const rotated = rotatePointFloat(absolutePointSchema.parse({ x, y }), center, -angleRadians);
      const inside =
        rotated.x >= minX && rotated.x <= maxX && rotated.y >= minY && rotated.y <= maxY;

      if (!inside) continue;

      if (!filled) {
        const innerMinX = minX + lineWidth;
        const innerMaxX = maxX - lineWidth;
        const innerMinY = minY + lineWidth;
        const innerMaxY = maxY - lineWidth;
        const insideInner =
          rotated.x > innerMinX &&
          rotated.x < innerMaxX &&
          rotated.y > innerMinY &&
          rotated.y < innerMaxY;
        if (insideInner) continue;
      }

      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        points.push(absolutePointSchema.parse({ x, y }));
      }
    }
  }

  return points;
}

function getRotatedEllipsePoints(
  rect: Rect,
  center: AbsolutePoint,
  angleRadians: number,
  lineWidth: number,
  filled: boolean,
): AbsolutePoint[] {
  const radiusX = Math.abs(rect.target.x - rect.origin.x) / 2;
  const radiusY = Math.abs(rect.target.y - rect.origin.y) / 2;
  const outerRx = radiusX;
  const outerRy = radiusY;
  const innerRx = Math.max(0, radiusX - lineWidth);
  const innerRy = Math.max(0, radiusY - lineWidth);
  const padding = Math.max(1, lineWidth);
  const bounds = getRotatedRectBounds(rect, center, angleRadians, padding);
  const points: AbsolutePoint[] = [];
  const seen = new Set<string>();

  for (let x = bounds.minX; x <= bounds.maxX; x++) {
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      const local = rotatePointFloat(absolutePointSchema.parse({ x, y }), center, -angleRadians);
      const dx = local.x - center.x;
      const dy = local.y - center.y;
      const outerTest = (dx * dx) / (outerRx * outerRx) + (dy * dy) / (outerRy * outerRy);
      if (outerTest > 1) continue;

      if (!filled && innerRx > 0 && innerRy > 0) {
        const innerTest = (dx * dx) / (innerRx * innerRx) + (dy * dy) / (innerRy * innerRy);
        if (innerTest <= 1) continue;
      }

      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        points.push(absolutePointSchema.parse({ x, y }));
      }
    }
  }

  return points;
}

export function getRectangleOutlinePoints(rect: Rect, lineWidth: number): AbsolutePoint[] {
  const minX = Math.min(rect.origin.x, rect.target.x);
  const maxX = Math.max(rect.origin.x, rect.target.x);
  const minY = Math.min(rect.origin.y, rect.target.y);
  const maxY = Math.max(rect.origin.y, rect.target.y);

  const points: AbsolutePoint[] = [];

  // Top edge
  for (let x = minX; x <= maxX; x++) {
    for (let offset = 0; offset < lineWidth; offset++) {
      points.push(absolutePointSchema.parse({ x, y: minY + offset }));
    }
  }

  // Bottom edge
  for (let x = minX; x <= maxX; x++) {
    for (let offset = 0; offset < lineWidth; offset++) {
      points.push(absolutePointSchema.parse({ x, y: maxY - offset }));
    }
  }

  // Left edge (excluding corners already covered)
  for (let y = minY + lineWidth; y <= maxY - lineWidth; y++) {
    for (let offset = 0; offset < lineWidth; offset++) {
      points.push(absolutePointSchema.parse({ x: minX + offset, y }));
    }
  }

  // Right edge (excluding corners already covered)
  for (let y = minY + lineWidth; y <= maxY - lineWidth; y++) {
    for (let offset = 0; offset < lineWidth; offset++) {
      points.push(absolutePointSchema.parse({ x: maxX - offset, y }));
    }
  }

  return points;
}

export function getRectangleFillPoints(rect: Rect): AbsolutePoint[] {
  const minX = Math.min(rect.origin.x, rect.target.x);
  const maxX = Math.max(rect.origin.x, rect.target.x);
  const minY = Math.min(rect.origin.y, rect.target.y);
  const maxY = Math.max(rect.origin.y, rect.target.y);

  const points: AbsolutePoint[] = [];

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      points.push(absolutePointSchema.parse({ x, y }));
    }
  }

  return points;
}

export function getEllipseOutlinePoints(rect: Rect, lineWidth: number): AbsolutePoint[] {
  const centerX = Math.round((rect.origin.x + rect.target.x) / 2);
  const centerY = Math.round((rect.origin.y + rect.target.y) / 2);
  const radiusX = Math.max(0, Math.round(Math.abs(rect.target.x - rect.origin.x) / 2));
  const radiusY = Math.max(0, Math.round(Math.abs(rect.target.y - rect.origin.y) / 2));

  if (radiusX === 0 && radiusY === 0) {
    return [absolutePointSchema.parse({ x: centerX, y: centerY })];
  }

  if (radiusX === 0 || radiusY === 0) {
    const points: AbsolutePoint[] = [];
    const minX = centerX - radiusX;
    const maxX = centerX + radiusX;
    const minY = centerY - radiusY;
    const maxY = centerY + radiusY;
    for (let x = minX; x <= maxX; x++) {
      points.push(absolutePointSchema.parse({ x, y: centerY }));
    }
    for (let y = minY; y <= maxY; y++) {
      points.push(absolutePointSchema.parse({ x: centerX, y }));
    }
    return lineWidth <= 1 ? points : getBrushPoints(points, lineWidth, 1);
  }

  const quadrantSteps = Math.max(12, Math.ceil((Math.PI / 2) * Math.max(radiusX, radiusY) * 3));
  const quadrantPoints: AbsolutePoint[] = [];

  for (let i = 0; i <= quadrantSteps; i++) {
    const angle = (i / quadrantSteps) * (Math.PI / 2);
    const dx = Math.round(radiusX * Math.cos(angle));
    const dy = Math.round(radiusY * Math.sin(angle));
    const x = centerX + dx;
    const y = centerY - dy;
    const last = quadrantPoints.at(-1);
    if (!last || last.x !== x || last.y !== y) {
      quadrantPoints.push(absolutePointSchema.parse({ x, y }));
    }
  }

  function connectPoints(from: AbsolutePoint, to: AbsolutePoint): AbsolutePoint[] {
    const points: AbsolutePoint[] = [];
    let x = from.x;
    let y = from.y;
    const stepX = Math.sign(to.x - from.x);
    const stepY = Math.sign(to.y - from.y);

    while (x !== to.x || y !== to.y) {
      if (x !== to.x && y !== to.y) {
        x += stepX;
        y += stepY;
      } else if (x !== to.x) {
        x += stepX;
      } else if (y !== to.y) {
        y += stepY;
      }
      points.push(absolutePointSchema.parse({ x, y }));
    }

    return points;
  }

  const connectedQuadrant: AbsolutePoint[] = [];
  for (let i = 0; i < quadrantPoints.length; i++) {
    const point = quadrantPoints[i];
    const prev = connectedQuadrant.at(-1);
    if (!prev) {
      connectedQuadrant.push(point);
      continue;
    }
    const segment = connectPoints(prev, point);
    connectedQuadrant.push(...segment);
  }

  const simplifiedQuadrant: AbsolutePoint[] = [];
  for (let i = 0; i < connectedQuadrant.length; i++) {
    const point = connectedQuadrant[i];
    const prev = simplifiedQuadrant.at(-1);
    const next = connectedQuadrant[i + 1];

    if (prev && next) {
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const ndx = next.x - prev.x;
      const ndy = next.y - prev.y;
      const isOrthogonal = dx === 0 || dy === 0;
      const canDiagonalSkip = Math.abs(ndx) <= 1 && Math.abs(ndy) <= 1 && ndx !== 0 && ndy !== 0;
      if (isOrthogonal && canDiagonalSkip) {
        continue;
      }
    }

    if (!prev || prev.x !== point.x || prev.y !== point.y) {
      simplifiedQuadrant.push(point);
    }
  }

  const symmetricPoints: AbsolutePoint[] = [];
  const seen = new Set<string>();

  for (const point of simplifiedQuadrant) {
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const candidates = [
      [centerX + dx, centerY + dy],
      [centerX - dx, centerY + dy],
      [centerX + dx, centerY - dy],
      [centerX - dx, centerY - dy],
    ];
    for (const [x, y] of candidates) {
      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        symmetricPoints.push(absolutePointSchema.parse({ x, y }));
      }
    }
  }

  if (lineWidth <= 1) {
    return symmetricPoints;
  }

  return getBrushPoints(symmetricPoints, lineWidth, 1);
}

export function getEllipseFillPoints(rect: Rect): AbsolutePoint[] {
  const centerX = (rect.origin.x + rect.target.x) / 2;
  const centerY = (rect.origin.y + rect.target.y) / 2;
  const radiusX = Math.abs(rect.target.x - rect.origin.x) / 2;
  const radiusY = Math.abs(rect.target.y - rect.origin.y) / 2;

  const points: AbsolutePoint[] = [];
  const pointsSet = new Set<string>();

  const minX = Math.floor(centerX - radiusX - 1);
  const maxX = Math.ceil(centerX + radiusX + 1);
  const minY = Math.floor(centerY - radiusY - 1);
  const maxY = Math.ceil(centerY + radiusY + 1);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const test = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);

      if (test <= 1) {
        const key = `${x},${y}`;
        if (!pointsSet.has(key)) {
          pointsSet.add(key);
          points.push(absolutePointSchema.parse({ x, y }));
        }
      }
    }
  }

  return points;
}

// Rectangle tool helpers
export function startRectangleAction(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
  size: number,
): RectangleActive {
  const rect = createRect(startPoint, startPoint, false, false);
  const points = getRectangleOutlinePoints(rect, size);

  return {
    type: ACTION_TYPES.RECTANGLE_ACTIVE,
    action_id: uuid(),
    color_ref,
    anchor: startPoint,
    rect,
    size,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function nextRectangleAction(
  activeAction: RectangleActive,
  endPoint: AbsolutePoint,
  constrainToSquare: boolean,
  drawFromCenter: boolean,
): RectangleActive {
  if (drawFromCenter) {
    const rotationCenter = activeAction.rotationCenter ?? getRectCenter(activeAction.rect);
    const rotationStartAngle =
      activeAction.rotationStartAngle ??
      Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotationAngle = Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotatedPoints = getRotatedRectanglePoints(
      activeAction.rect,
      rotationCenter,
      rotationAngle - rotationStartAngle,
      activeAction.size,
      false,
    );

    return {
      ...activeAction,
      rotationCenter,
      rotationStartAngle,
      chunkKeys: getUniqueChunksFromPoints(rotatedPoints),
      points: rotatedPoints,
    };
  }

  const rect = createRect(activeAction.anchor, endPoint, constrainToSquare, drawFromCenter);
  const points = getRectangleOutlinePoints(rect, activeAction.size);

  return {
    ...activeAction,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function completeRectangleAction(activeAction: RectangleActive): RectangleComplete {
  return {
    type: ACTION_TYPES.RECTANGLE_COMPLETE,
    action_id: activeAction.action_id,
    color_ref: activeAction.color_ref,
    rect: activeAction.rect,
    size: activeAction.size,
    chunkKeys: activeAction.chunkKeys,
    points: activeAction.points,
  };
}

// RectangleFill tool helpers
export function startRectangleFillAction(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
): RectangleFillActive {
  const rect = createRect(startPoint, startPoint, false, false);
  const points = getRectangleFillPoints(rect);

  return {
    type: ACTION_TYPES.RECTANGLE_FILL_ACTIVE,
    action_id: uuid(),
    color_ref,
    anchor: startPoint,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function nextRectangleFillAction(
  activeAction: RectangleFillActive,
  endPoint: AbsolutePoint,
  constrainToSquare: boolean,
  drawFromCenter: boolean,
): RectangleFillActive {
  if (drawFromCenter) {
    const rotationCenter = activeAction.rotationCenter ?? getRectCenter(activeAction.rect);
    const rotationStartAngle =
      activeAction.rotationStartAngle ??
      Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotationAngle = Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotatedPoints = getRotatedRectanglePoints(
      activeAction.rect,
      rotationCenter,
      rotationAngle - rotationStartAngle,
      1,
      true,
    );

    return {
      ...activeAction,
      rotationCenter,
      rotationStartAngle,
      chunkKeys: getUniqueChunksFromPoints(rotatedPoints),
      points: rotatedPoints,
    };
  }

  const rect = createRect(activeAction.anchor, endPoint, constrainToSquare, drawFromCenter);
  const points = getRectangleFillPoints(rect);

  return {
    ...activeAction,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function completeRectangleFillAction(
  activeAction: RectangleFillActive,
): RectangleFillComplete {
  return {
    type: ACTION_TYPES.RECTANGLE_FILL_COMPLETE,
    action_id: activeAction.action_id,
    color_ref: activeAction.color_ref,
    rect: activeAction.rect,
    chunkKeys: activeAction.chunkKeys,
    points: activeAction.points,
  };
}

// Ellipse tool helpers
export function startEllipseAction(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
  size: number,
): EllipseActive {
  const rect = createRect(startPoint, startPoint, false, false);
  const points = getEllipseOutlinePoints(rect, size);

  return {
    type: ACTION_TYPES.ELLIPSE_ACTIVE,
    action_id: uuid(),
    color_ref,
    anchor: startPoint,
    rect,
    size,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function nextEllipseAction(
  activeAction: EllipseActive,
  endPoint: AbsolutePoint,
  constrainToSquare: boolean,
  drawFromCenter: boolean,
): EllipseActive {
  if (drawFromCenter) {
    const rotationCenter = activeAction.rotationCenter ?? getRectCenter(activeAction.rect);
    const rotationStartAngle =
      activeAction.rotationStartAngle ??
      Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotationAngle = Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotatedPoints = getRotatedEllipsePoints(
      activeAction.rect,
      rotationCenter,
      rotationAngle - rotationStartAngle,
      activeAction.size,
      false,
    );

    return {
      ...activeAction,
      rotationCenter,
      rotationStartAngle,
      chunkKeys: getUniqueChunksFromPoints(rotatedPoints),
      points: rotatedPoints,
    };
  }

  const rect = createRect(activeAction.anchor, endPoint, constrainToSquare, drawFromCenter);
  const points = getEllipseOutlinePoints(rect, activeAction.size);

  return {
    ...activeAction,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function completeEllipseAction(activeAction: EllipseActive): EllipseComplete {
  return {
    type: ACTION_TYPES.ELLIPSE_COMPLETE,
    action_id: activeAction.action_id,
    color_ref: activeAction.color_ref,
    rect: activeAction.rect,
    size: activeAction.size,
    chunkKeys: activeAction.chunkKeys,
    points: activeAction.points,
  };
}

// EllipseFill tool helpers
export function startEllipseFillAction(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
): EllipseFillActive {
  const rect = createRect(startPoint, startPoint, false, false);
  const points = getEllipseFillPoints(rect);

  return {
    type: ACTION_TYPES.ELLIPSE_FILL_ACTIVE,
    action_id: uuid(),
    color_ref,
    anchor: startPoint,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function nextEllipseFillAction(
  activeAction: EllipseFillActive,
  endPoint: AbsolutePoint,
  constrainToSquare: boolean,
  drawFromCenter: boolean,
): EllipseFillActive {
  if (drawFromCenter) {
    const rotationCenter = activeAction.rotationCenter ?? getRectCenter(activeAction.rect);
    const rotationStartAngle =
      activeAction.rotationStartAngle ??
      Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotationAngle = Math.atan2(endPoint.y - rotationCenter.y, endPoint.x - rotationCenter.x);
    const rotatedPoints = getRotatedEllipsePoints(
      activeAction.rect,
      rotationCenter,
      rotationAngle - rotationStartAngle,
      1,
      true,
    );

    return {
      ...activeAction,
      rotationCenter,
      rotationStartAngle,
      chunkKeys: getUniqueChunksFromPoints(rotatedPoints),
      points: rotatedPoints,
    };
  }

  const rect = createRect(activeAction.anchor, endPoint, constrainToSquare, drawFromCenter);
  const points = getEllipseFillPoints(rect);

  return {
    ...activeAction,
    rect,
    rotationCenter: undefined,
    rotationStartAngle: undefined,
    rotationBasePoints: undefined,
    chunkKeys: getUniqueChunksFromPoints(points),
    points,
  };
}

export function completeEllipseFillAction(activeAction: EllipseFillActive): EllipseFillComplete {
  return {
    type: ACTION_TYPES.ELLIPSE_FILL_COMPLETE,
    action_id: activeAction.action_id,
    color_ref: activeAction.color_ref,
    rect: activeAction.rect,
    chunkKeys: activeAction.chunkKeys,
    points: activeAction.points,
  };
}
