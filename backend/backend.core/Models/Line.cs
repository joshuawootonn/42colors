using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace backend.Models
{
    public class Line
    {
        public int brushRadius { get; set; }
        public string brushColor { get; set; }
        public IReadOnlyCollection<Point> points { get; set; }
        public int lineId { get; set; }
    }

    public class Line2
    {
        public LineString geom { get; set; }
        public int brushWidth { get; set; }
        public string brushColor { get; set; }
        public int lineId { get; set; }
    }
}