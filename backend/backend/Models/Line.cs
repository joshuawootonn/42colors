using System.Collections.ObjectModel;

namespace backend.Models
{
    public class Line
    {
        public double brushRadius { get; set; }
        public string brushColor { get; set; }
        public ReadOnlyCollection<Point> points { get; set; }
    }
}