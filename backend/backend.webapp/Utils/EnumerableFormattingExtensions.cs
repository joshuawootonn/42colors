using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace backend.Utils
{
    public static class EnumerableFormattingExtensions
    {
        public static string toListText<T>(this IEnumerable<T> collection)
        {
            return string.Join(Environment.NewLine, collection.Select(o =>
            {
                var stringBuilder = new StringBuilder("- ");

                using (var linesEnumerator = o.getLines().GetEnumerator())
                {
                    if (linesEnumerator.MoveNext())
                        stringBuilder.AppendLine(linesEnumerator.Current);

                    while (linesEnumerator.MoveNext())
                        stringBuilder.AppendLine($"  {linesEnumerator.Current}");
                }

                return stringBuilder.ToString().TrimEnd();
            }));
        }

        private static IEnumerable<string> getLines(this object @object)
        {
            return @object.ToString().Split(new[] {Environment.NewLine}, StringSplitOptions.None);
        }
    }
}