using System.Linq;
using backend.Models;

namespace backend.Requests
{
    public class PostLine
    {
        public PostLine(Line line)
        {
            points = line.points.ToArray();
            brushColor = line.brushColor;
            brushRadius = line.brushRadius;
        }

        private Point[] points { get; }
        public string brushColor { get; set; }
        public int brushRadius { get; set; }
    }
}