using backend.core.Models;
using backend.Requests;

namespace backend.test.core
{
    public static class Bad
    {
        public static LineRequest lineWithInvalidHex => new LineRequest
        {
            brushColor = "000",
            brushWidth = 10,
            points = Good.points
        };

        public static LineRequest lineWith0BrushRadius => new LineRequest
        {
            brushColor = "#000",
            brushWidth = 0,
            points = Good.points
        };

        public static LineRequest lineWith101BrushRadius => new LineRequest
        {
            brushColor = "000",
            brushWidth = 101,
            points = Good.points
        };

        public static LineRequest lineWithEmptyPoints => new LineRequest
        {
            brushColor = "000",
            brushWidth = 101,
            points = new Point[0]
        };
        
        public static LineRequest linePartiallyInside = new LineRequest
        {
            points = new[]
            {
                new Point(1, 1),
                new Point(2001, 2001),
            },
            brushColor = "#ffffff",
            brushWidth = 10
        };
            
        public static LineRequest lineOutside = new LineRequest
        {
            points = new[]
            {
                new Point(2001, 2001),
                new Point(3999, 3999),
            },
            brushColor = "#ffffff",
            brushWidth = 10
        };
    }
}