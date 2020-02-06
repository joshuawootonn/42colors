using System.Collections.Generic;
using System.Linq;
using backend.Models;

namespace backend.Views
{
    // TODO: this model is a temp
    public class GetLines
    {
        public GetLines(List<Line> list)
        {
            lines = lines.ToArray();
        }

        public Line[] lines { get; set; }
    }
}