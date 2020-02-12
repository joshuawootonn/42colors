using System.Collections.Generic;
using System.Linq;
using backend.Models;

namespace backend.Views
{
    // TODO: this model is a temp
    public class GetLinesView
    {
        public GetLinesView(IReadOnlyCollection<Line> lines)
        {
            this.lines = lines.Count > 0 ? lines.ToArray() : new Line[] { };
        }

        public Line[] lines { get; }
    }
}