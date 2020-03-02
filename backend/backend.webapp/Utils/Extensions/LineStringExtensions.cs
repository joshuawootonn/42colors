using System.Linq;
using NetTopologySuite.Geometries;
using Point = backend.core.Models.Point;

namespace backend.Utils.Extensions
{
    public static class LineStringExtensions
    {
        public static Point[] toPoints(this LineString lineString)
        {
            return lineString.Coordinates.Select(coordinate => new Point(coordinate.X, coordinate.Y)).ToArray();
        }
    }
}