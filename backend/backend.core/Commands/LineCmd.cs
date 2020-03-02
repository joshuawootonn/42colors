using NetTopologySuite.Geometries;

namespace backend.core.Commands
{
    public class LineCmd
    {
        public LineString geom { get; set; }
        public int brushWidth { get; set; }
        public string brushColor { get; set; }
    }
}