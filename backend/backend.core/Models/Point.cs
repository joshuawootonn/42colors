using NetTopologySuite.Geometries;

namespace backend.Models
{
    public class Point
    {
        public double x { get; set; }
        public double y { get; set; }

        public Point(double x, double y)
        {
            this.x = x;
            this.y = y;
        }

        public Point()
        {
            
        }

        public Coordinate toCoordinate()
        {
            return new Coordinate(x,y);
        }
    }
}