using System.Collections.Generic;
using System.Linq;
using backend.core.Models;
using backend.Utils.Extensions;
using Newtonsoft.Json;

namespace backend.Views
{
    public class LinesViewModel
    {
        [JsonConstructor]
        public LinesViewModel(LineViewModel[] lines)
        {
            this.lines = lines;
        }

        public LinesViewModel(IReadOnlyCollection<Line> lines)
        {
            this.lines = lines.Count > 0
                ? lines.Select(line => new LineViewModel(line)).ToArray()
                : new LineViewModel[] { };
        }

        public LineViewModel[] lines { get; }
    }

    public class LineViewModel
    {
        [JsonConstructor]
        public LineViewModel(Point[] points, int brushWidth, string brushColor, int lineId)
        {
            this.points = points;
            this.brushWidth = brushWidth;
            this.brushColor = brushColor;
            this.lineId = lineId;
        }

        public LineViewModel(Line line)
        {
            points = line.geom.toPoints();
            brushColor = line.brushColor;
            brushWidth = line.brushWidth;
            lineId = line.lineId;
        }

        public Point[] points { get; set; }
        public int brushWidth { get; set; }
        public string brushColor { get; set; }
        public int lineId { get; set; }
    }
}