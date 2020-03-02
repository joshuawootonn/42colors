using System.Linq;
using backend.core.Commands;
using FluentValidation;
using NetTopologySuite.Geometries;
using Point = backend.core.Models.Point;

namespace backend.Requests
{
    public class LineRequest
    {
        public Point[] points { get; set; }
        public string brushColor { get; set; }
        public int brushWidth { get; set; }

        public LineCmd toCmd()
        {
            return new LineCmd
            {
                geom = new LineString(points.Select(point => point.toCoordinate()).ToArray()) {SRID = 4326},
                brushColor = brushColor,
                brushWidth = brushWidth
            };
        }
    }

    public class LineRequestValidator : AbstractValidator<LineRequest>
    {
        public LineRequestValidator()
        {
            RuleFor(x => x.brushColor).NotEmpty().Matches("^#(?:[0-9a-fA-F]{3}){1,2}$");
            RuleFor(x => x.brushWidth).NotEmpty().LessThan(100).GreaterThanOrEqualTo(1);
            RuleFor(x => x.points).NotEmpty();
        }
    }
}