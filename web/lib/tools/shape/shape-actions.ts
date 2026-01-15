import { ACTION_TYPES } from "../../action-types";
import { AbsolutePoint } from "../../geometry/coord";
import { Rect } from "../../geometry/rect";
import { ColorRef } from "../../palette";

export type RectangleActive = {
  type: typeof ACTION_TYPES.RECTANGLE_ACTIVE;
  action_id: string;
  color_ref: ColorRef;
  anchor: AbsolutePoint;
  rect: Rect;
  size: number;
  rotationCenter?: AbsolutePoint;
  rotationStartAngle?: number;
  rotationBasePoints?: AbsolutePoint[];
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type RectangleComplete = {
  type: typeof ACTION_TYPES.RECTANGLE_COMPLETE;
  action_id: string;
  color_ref: ColorRef;
  rect: Rect;
  size: number;
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type RectangleFillActive = {
  type: typeof ACTION_TYPES.RECTANGLE_FILL_ACTIVE;
  action_id: string;
  color_ref: ColorRef;
  anchor: AbsolutePoint;
  rect: Rect;
  rotationCenter?: AbsolutePoint;
  rotationStartAngle?: number;
  rotationBasePoints?: AbsolutePoint[];
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type RectangleFillComplete = {
  type: typeof ACTION_TYPES.RECTANGLE_FILL_COMPLETE;
  action_id: string;
  color_ref: ColorRef;
  rect: Rect;
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type EllipseActive = {
  type: typeof ACTION_TYPES.ELLIPSE_ACTIVE;
  action_id: string;
  color_ref: ColorRef;
  anchor: AbsolutePoint;
  rect: Rect;
  size: number;
  rotationCenter?: AbsolutePoint;
  rotationStartAngle?: number;
  rotationBasePoints?: AbsolutePoint[];
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type EllipseComplete = {
  type: typeof ACTION_TYPES.ELLIPSE_COMPLETE;
  action_id: string;
  color_ref: ColorRef;
  rect: Rect;
  size: number;
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type EllipseFillActive = {
  type: typeof ACTION_TYPES.ELLIPSE_FILL_ACTIVE;
  action_id: string;
  color_ref: ColorRef;
  anchor: AbsolutePoint;
  rect: Rect;
  rotationCenter?: AbsolutePoint;
  rotationStartAngle?: number;
  rotationBasePoints?: AbsolutePoint[];
  chunkKeys: string[];
  points: AbsolutePoint[];
};

export type EllipseFillComplete = {
  type: typeof ACTION_TYPES.ELLIPSE_FILL_COMPLETE;
  action_id: string;
  color_ref: ColorRef;
  rect: Rect;
  chunkKeys: string[];
  points: AbsolutePoint[];
};
