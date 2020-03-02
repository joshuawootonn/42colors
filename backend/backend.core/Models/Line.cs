using NetTopologySuite.Geometries;

namespace backend.core.Models
{
    public class Line
    {
        public LineString geom { get; set; }
        public int brushWidth { get; set; }
        public string brushColor { get; set; }
        public int lineId { get; set; }
    }
}