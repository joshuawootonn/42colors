using System;
using System.Linq;
using backend.Models;
using backend.Requests;

namespace backend.test.core
{
    public static class Bad
    {
        private static readonly Random rand = new Random();

        public static Point point => new Point
        {
            x = rand.Next(1, 1000),
            y = rand.Next(1, 1000)
        };
        

        public static CreateLineRequest lineWithInvalidHex => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 10,
            points = Enumerable.Repeat(Good.point, 1000).ToArray()
        };
        
        public static CreateLineRequest lineWith0BrushRadius => new CreateLineRequest
        {
            brushColor = "#000",
            brushRadius = 0,
            points = Enumerable.Repeat(Good.point, 1000).ToArray()
        };
        
        public static CreateLineRequest lineWith101BrushRadius => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 101,
            points = Enumerable.Repeat(Good.point, 1000).ToArray()
        };
        public static CreateLineRequest lineWithEmptyPoints => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 101,
            points = new Point[0]
        };
    }
}