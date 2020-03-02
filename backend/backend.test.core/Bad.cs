using backend.Models;
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
    }
}