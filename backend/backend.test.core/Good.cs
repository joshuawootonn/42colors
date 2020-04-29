using System;
using System.Linq;
using backend.core.Models;
using backend.Requests;
using NetTopologySuite.Geometries;
using Point = backend.core.Models.Point;

namespace backend.test.core
{
    public static class Good
    {
        private static readonly Random rand = new Random();

        public static readonly Point[] points = Enumerable.Range(1, 100).Select(_ => new Point
        {
            x = rand.Next(1, 1000),
            y = rand.Next(1, 1000)
        }).ToArray();


        public static LineRequest lineRequest => new LineRequest
        {
            brushColor = "#000",
            brushWidth = 5,
            points = points
        };

        public static Line line => new Line
        {
            geom = new LineString(lineRequest.points.Select(point => point.toCoordinate()).ToArray()) {SRID = 4326},
            brushColor = lineRequest.brushColor,
            brushWidth = lineRequest.brushWidth,
            lineId = 1
        };


        public static CreatePlayerRequest playerRequest => new CreatePlayerRequest
        {
            name = "name"
        };

        public static Player player => new Player
        {
            player_id = 1,
            name = playerRequest.name
        };
    }
}