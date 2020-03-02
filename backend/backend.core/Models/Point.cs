using NetTopologySuite.Geometries;

namespace backend.core.Models
{
    public class Point
    {
        public Point(double x, double y)
        {
            this.x = x;
            this.y = y;
        }

        public Point()
        {
        }

        public double x { get; set; }
        public double y { get; set; }

        public Coordinate toCoordinate()
        {
            return new Coordinate(x, y);
        }
    }
}