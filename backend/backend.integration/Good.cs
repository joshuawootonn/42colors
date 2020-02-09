using System;
using System.Linq;
using backend.Models;

namespace backend.integration
{
    public static class Good
    {
        private static Random rand = new Random();
        public static Line line => new Line
        {
            brushColor = "#000",
            brushRadius = 10,
            points = Enumerable.Repeat(point, 1000).ToList(),
        };

        public static Point point => new Point
        {
            x = rand.Next(1, 1000),
            y = rand.Next(1, 1000)
        };


    }
}