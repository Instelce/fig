import { Vector } from "@fig/types/properties/Vector";
import { pointsDistance } from "./point";
import { Line } from "@fig/types/shapes/Line";

const { abs, pow, sqrt } = Math;

type HoverLineArgs = {
  line: {
    start: Vector;
    end: Vector;
  };
  cursorPosition: Vector;
};

/**
 * Check if the cursor is on the mouse.
 */
export function hoverLine({ line, cursorPosition }: HoverLineArgs): boolean {
  return pointToSegmentDistance({ line, point: cursorPosition }) < 6;
}

type PointToLineDistanceArgs = {
  line: {
    start: Vector;
    end: Vector;
  };
  point: Vector;
};

/**
 * Calculate the distance from a point to a line.
 */
export function pointToLineDistance({
  line: { start, end },
  point,
}: PointToLineDistanceArgs) {
  return (
    abs(
      (end.y - start.y) * point.x -
        (end.x - start.x) * point.y +
        end.x * start.y -
        end.y * start.x,
    ) / pointsDistance(start, end)
  );
}

/**
 * Calculate the distance from a point to a segment.
 * *
 * Made with help of this [stackoverflow answer](https://stackoverflow.com/a/6853926)
 */
export function pointToSegmentDistance({
  line: { start, end },
  point,
}: PointToLineDistanceArgs) {
  let A = point.x - start.x;
  let B = point.y - start.y;
  let C = end.x - start.x;
  let D = end.y - start.y;

  let dot = A * C + B * D;
  let len_sq = C * C + D * D;
  let param = -1;
  if (len_sq != 0)
    //in case of 0 length line
    param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  let dx = point.x - xx;
  let dy = point.y - yy;

  return sqrt(dx * dx + dy * dy);
}

export function centerOfSegment(line: Line): Vector {
  return {
    x: (line.start.x + line.end.x) / 2,
    y: (line.start.y + line.end.y) / 2,
  };
}