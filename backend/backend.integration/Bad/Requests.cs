using System;
using System.Linq;
using backend.Models;
using backend.Requests;

namespace backend.integration.Bad
{
    public static class Requests
    {
        private static readonly Random rand = new Random();

        public static CreateLineRequest lineWithInvalidHex => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 10,
            points = Enumerable.Repeat(Good.Models.point, 1000).ToArray()
        };
        
        public static CreateLineRequest lineWith0BrushRadius => new CreateLineRequest
        {
            brushColor = "#000",
            brushRadius = 0,
            points = Enumerable.Repeat(Good.Models.point, 1000).ToArray()
        };
        
        public static CreateLineRequest lineWith101BrushRadius => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 101,
            points = Enumerable.Repeat(Good.Models.point, 1000).ToArray()
        };
        public static CreateLineRequest lineWithEmptyPoints => new CreateLineRequest
        {
            brushColor = "000",
            brushRadius = 101,
            points = new Point[0]
        };
    }
}