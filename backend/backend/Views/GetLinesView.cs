using System.Collections.Generic;
using System.Linq;
using backend.Models;

namespace backend.Views
{
    // TODO: this model is a temp
    public class GetLinesView
    {
        public GetLinesView(IEnumerable<Line> lines)
        {
            this.lines = lines.ToArray();
        }

        private Line[] lines { get; }
    }
}