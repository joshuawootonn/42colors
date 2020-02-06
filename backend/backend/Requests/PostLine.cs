using backend.Models;

namespace backend.Requests
{
    public class PostLine
    {
        private Point[] points { get; set; }
        public string brushColor { get; set; }
        public int brushRadius { get; set;  }
    }
}