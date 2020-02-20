using System.Collections.Generic;

namespace backend.Models
{
    public class Line
    {
        public int brushRadius { get; set; }
        public string brushColor { get; set; }
        public IReadOnlyCollection<Point> points { get; set; }
    }
}