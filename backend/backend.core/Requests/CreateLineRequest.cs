using System.Drawing;
using backend.Models;
using FluentValidation;
using Point = backend.Models.Point;

namespace backend.Requests
{
    public class CreateLineRequest
    {
        public Point[] points { get; set; }
        public string brushColor { get; set; }
        public int brushRadius { get; set; }

        public Line toLine()
        {
            return new Line
            {
                points = this.points,
                brushColor = this.brushColor,
                brushRadius = this.brushRadius
            };
        }
    }

    public class CreateLineRequestValidator : AbstractValidator<CreateLineRequest>
    {
        public CreateLineRequestValidator()
        {
            RuleFor(x => x.brushColor).NotEmpty().Matches("^#(?:[0-9a-fA-F]{3}){1,2}$");
            RuleFor(x => x.brushRadius).NotEmpty().LessThan(100).GreaterThanOrEqualTo(1);
            RuleFor(x => x.points).NotEmpty();
        }
    }
}