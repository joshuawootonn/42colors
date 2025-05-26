import { describe, expect, test } from "vitest";
import { bunchOfLinesSchema, bunchOfTuplePointsSchema } from "./utils/testing";
import {
  rectToPolygonSchema,
  sortIntoClockwiseOrder,
  getIntersectionPoints,
  inside,
  sortLinesClockwise,
} from "./polygon";
import { absolutePointSchema } from "./coord";
import {
  rect1,
  rect2,
  rect3,
  rect4,
  rect5,
  rect6,
  rect7,
} from "./rectilinear.test";
import { absolutePointTupleSchema, lineSchema } from "./line";

const sortedPoints = bunchOfTuplePointsSchema.parse([
  [-1, 1],
  [-1, -1],
  [1, -1],
  [1, 1],
]);

const scrambledPoints = bunchOfTuplePointsSchema.parse([
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
]);

const scrambledPositivePoints = bunchOfTuplePointsSchema.parse([
  [15, 5],
  [5, 15],
  [10, 5],
  [0, 0],
  [10, 0],
  [15, 15],
  [0, 10],
  [5, 10],
]);

const sortedPositivePoints = bunchOfTuplePointsSchema.parse([
  [5, 15],
  [5, 10],
  [0, 10],
  [0, 0],
  [10, 0],
  [10, 5],
  [15, 5],
  [15, 15],
]);

const scrambledPoints2 = bunchOfTuplePointsSchema.parse([
  [3, 2],
  [0, 0],
  [0, 4],
  [9, 2],
  [3, 0],
  [9, 4],
]);
const sortedPoints2 = bunchOfTuplePointsSchema.parse([
  [0, 0],
  [3, 0],
  [3, 2],
  [9, 2],
  [9, 4],
  [0, 4],
]);

describe("sortIntoClockwiseOrder", () => {
  test("already sorted", () => {
    expect(sortIntoClockwiseOrder(sortedPoints)).toEqual(sortedPoints);
  });
  test("sorting needed", () => {
    expect(sortIntoClockwiseOrder(scrambledPoints)).toEqual(sortedPoints);
  });
  test("sorted all positive points", () => {
    expect(sortIntoClockwiseOrder(scrambledPositivePoints)).toEqual(
      sortedPositivePoints,
    );
  });
  // test("sorted all positive points 2", () => {
  //   expect(sortIntoClockwiseOrder(scrambledPoints2)).toBeFalsy();
  // });
});

const polygon1 = rectToPolygonSchema.parse(rect1);
const polygon2 = rectToPolygonSchema.parse(rect2);
const polygon3 = rectToPolygonSchema.parse(rect3);
const polygon4 = rectToPolygonSchema.parse(rect4);
const polygon5 = rectToPolygonSchema.parse(rect5);
const polygon6 = rectToPolygonSchema.parse(rect6);
const polygon7 = rectToPolygonSchema.parse(rect7);

describe("getIntersectionPoints", () => {
  test("no", () => {
    expect(getIntersectionPoints(polygon1, polygon3)).toEqual({
      intersectionPoints: [],
      intersectionSublines: [],
    });
  });
  test("1 5", () => {
    expect(getIntersectionPoints(polygon1, polygon5)).toEqual({
      intersectionPoints: [
        absolutePointTupleSchema.parse([10, 5]),
        absolutePointTupleSchema.parse([5, 10]),
      ],
      intersectionSublines: [
        polygon1n5Intersection1,
        polygon1n5Intersection2,
        polygon1n5Intersection3,
        polygon1n5Intersection4,
      ],
    });
  });
  test("6 7", () => {
    expect(getIntersectionPoints(polygon6, polygon7)).toEqual({
      intersectionPoints: [
        absolutePointTupleSchema.parse([15, 25]),
        absolutePointTupleSchema.parse([15, 35]),
      ],
      intersectionSublines: [
        polygon6n7Intersection1.slice().reverse(),
        polygon6n7Intersection2,
        polygon6n7Intersection3,
        polygon6n7Intersection4.slice().reverse(),
      ],
    });
  });
  // test.only("many overlapping points", () => {
  //   expect(getIntersectionPoints(polygon2, polygon3)).toEqual({
  //     intersectionPoints: [
  //       absolutePointSchema.parse({ x: 15, y: 0 }),
  //       absolutePointSchema.parse({ x: 20, y: 0 }),
  //       absolutePointSchema.parse({ x: 20, y: 10 }),
  //       absolutePointSchema.parse({ x: 15, y: 10 }),
  //     ],
  //     intersectionSublines: [],
  //   });
  // });
});

describe("inside", () => {
  test("no", () => {
    expect(
      inside(absolutePointTupleSchema.parse([20, 20]), polygon1),
    ).toBeFalsy();
  });
  test("yes", () => {
    expect(
      inside(absolutePointTupleSchema.parse([5, 5]), polygon1),
    ).toBeTruthy();
  });
});

const polygon1Right = [
  [10, 0],
  [10, 10],
];
const polygon1Bottom = [
  [10, 10],
  [0, 10],
];
const polygon1Left = [
  [0, 10],
  [0, 0],
];
const polygon1Top = [
  [0, 0],
  [10, 0],
];

const polygon5Right = [
  [15, 5],
  [15, 15],
];
const polygon5Bottom = [
  [15, 15],
  [5, 15],
];
const polygon5Left = [
  [5, 15],
  [5, 5],
];
const polygon5Top = [
  [5, 5],
  [15, 5],
];

const polygon1n5Intersection1 = [
  [10, 5],
  [10, 0],
];
const polygon1n5Intersection2 = [
  [10, 5],
  [15, 5],
];
const polygon1n5Intersection3 = [
  [5, 10],
  [0, 10],
];
const polygon1n5Intersection4 = [
  [5, 10],
  [5, 15],
];

const scrambled15Lines = bunchOfLinesSchema.parse([
  polygon1n5Intersection1,
  polygon1n5Intersection2,
  polygon1n5Intersection3,
  polygon1n5Intersection4,
  polygon1Top,
  polygon1Left,
  polygon5Bottom,
  polygon5Right,
]);

const sorted15Lines = bunchOfLinesSchema.parse([
  polygon1n5Intersection4.slice().reverse(),
  polygon1n5Intersection3,
  polygon1Left,
  polygon1Top,
  polygon1n5Intersection1.slice().reverse(),
  polygon1n5Intersection2,
  polygon5Right,
  polygon5Bottom,
]);

const polygon6Right = [
  [15, 20],
  [15, 40],
];
const polygon6Bottom = [
  [15, 40],
  [5, 40],
];
const polygon6Left = [
  [5, 40],
  [5, 20],
];
const polygon6Top = [
  [5, 20],
  [15, 20],
];

const polygon7Right = [
  [20, 25],
  [20, 35],
];
const polygon7Bottom = [
  [20, 35],
  [10, 35],
];
const polygon7Left = [
  [10, 35],
  [10, 25],
];
const polygon7Top = [
  [10, 25],
  [20, 35],
];

const polygon6n7Intersection1 = [
  [15, 20],
  [15, 25],
];
const polygon6n7Intersection2 = [
  [15, 25],
  [20, 25],
];

const polygon6n7Intersection3 = [
  [15, 35],
  [15, 40],
];
const polygon6n7Intersection4 = [
  [20, 35],
  [15, 35],
];

const scrambled67Lines = bunchOfLinesSchema.parse([
  polygon6n7Intersection1,
  polygon6n7Intersection2,
  polygon6n7Intersection3,
  polygon6n7Intersection4,
  polygon6Top,
  polygon6Left,
  polygon6Bottom,
  polygon7Right,
]);

const sorted67Lines = bunchOfLinesSchema.parse([
  polygon6Bottom,
  polygon6Left,
  polygon6Top,
  polygon6n7Intersection1,
  polygon6n7Intersection2,
  polygon7Right,
  polygon6n7Intersection4,
  polygon6n7Intersection3,
]);

describe("sortLinesClockwise", () => {
  test("1", () => {
    expect(
      sortLinesClockwise(
        bunchOfLinesSchema.parse([
          polygon5Right,
          polygon1Top,
          polygon1Left,
          polygon5Bottom,
        ]),
      ),
    ).toEqual(
      bunchOfLinesSchema.parse([
        polygon1Left,
        polygon1Top,
        polygon5Right,
        polygon5Bottom,
      ]),
    );
  });
  test("1 5", () => {
    expect(sortLinesClockwise(scrambled15Lines)).toEqual(sorted15Lines);
  });
  test("6 7", () => {
    expect(sortLinesClockwise(scrambled67Lines)).toEqual(sorted67Lines);
  });
});

// describe("getCompositePolygon", () => {
//   test("no", () => {
//     expect(getCompositePolygon(polygon1, polygon5)).toEqual(
//       polygonSchema.parse({
//         vertices: [
//           {
//             x: 5,
//             y: 15,
//           },
//           {
//             x: 5,
//             y: 10,
//           },
//           {
//             x: 0,
//             y: 10,
//           },
//           {
//             x: 0,
//             y: 0,
//           },
//           {
//             x: 10,
//             y: 0,
//           },
//           {
//             x: 10,
//             y: 5,
//           },
//           {
//             x: 15,
//             y: 5,
//           },
//           {
//             x: 15,
//             y: 15,
//           },
//         ],
//         lines: [
//           [
//             {
//               x: 10,
//               y: 5,
//             },
//             {
//               x: 10,
//               y: 0,
//             },
//           ],
//           [
//             {
//               x: 10,
//               y: 5,
//             },
//             {
//               x: 15,
//               y: 5,
//             },
//           ],
//           [
//             {
//               x: 0,
//               y: 0,
//             },
//             {
//               x: 10,
//               y: 0,
//             },
//           ],
//           [
//             {
//               x: 0,
//               y: 10,
//             },
//             {
//               x: 0,
//               y: 0,
//             },
//           ],
//           [
//             {
//               x: 5,
//               y: 10,
//             },
//             {
//               x: 0,
//               y: 10,
//             },
//           ],
//           [
//             {
//               x: 5,
//               y: 10,
//             },
//             {
//               x: 5,
//               y: 15,
//             },
//           ],
//           [
//             {
//               x: 15,
//               y: 5,
//             },
//             {
//               x: 15,
//               y: 15,
//             },
//           ],
//           [
//             {
//               x: 15,
//               y: 15,
//             },
//             {
//               x: 5,
//               y: 15,
//             },
//           ],
//         ],
//       }),
//     );
//   });
// });
//
// describe("getCompositePolygons", () => {
//   test("no", () => {
//     expect(getCompositePolygons([polygon1, polygon5])).toEqual([
//       polygonSchema.parse({
//         vertices: [
//           {
//             x: 5,
//             y: 15,
//           },
//           {
//             x: 5,
//             y: 10,
//           },
//           {
//             x: 0,
//             y: 10,
//           },
//           {
//             x: 0,
//             y: 0,
//           },
//           {
//             x: 10,
//             y: 0,
//           },
//           {
//             x: 10,
//             y: 5,
//           },
//           {
//             x: 15,
//             y: 5,
//           },
//           {
//             x: 15,
//             y: 15,
//           },
//         ],
//       }),
//     ]);
//   });
// });
