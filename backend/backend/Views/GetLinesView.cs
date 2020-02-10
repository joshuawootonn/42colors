using System.Collections.Generic;
using System.Linq;
using backend.Models;

namespace backend.Views
{
    // TODO: this model is a temp
    public class GetLinesView
    {
        public GetLinesView(List<Line> list)
        {
            lines = lines.ToArray();
        }

        public Line[] lines { get; set; }
    }
}