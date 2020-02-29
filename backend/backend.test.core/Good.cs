using System;
using System.Linq;
using backend.Models;
using backend.Requests;
using NetTopologySuite.Geometries;
using Point = backend.Models.Point;

namespace backend.test.core
{
    public static class Good
    {
        private static readonly Random rand = new Random();

        public static Line2 line2 = new Line2
        {
            geom = new LineString(new[] {new Coordinate(1, 1), new Coordinate(2, 2)}),
            brushColor = "#000",
            brushWidth = 10,
            lineId = 1,
        };

        public static Point point => new Point
        {
            x = rand.Next(1, 1000),
            y = rand.Next(1, 1000)
        };

        public static Player player => new Player
        {
            player_id = 1,
            name = "asdf1234"
        };

        public static CreateLineRequest line => new CreateLineRequest
        {
            brushColor = "#000",
            brushRadius = 10,
            points = Enumerable.Repeat(point, 1000).ToArray()
        };

        public static CreatePlayerRequest createPlayerRequest => new CreatePlayerRequest
        {
            name = "asdf1234"
        };
    }
}