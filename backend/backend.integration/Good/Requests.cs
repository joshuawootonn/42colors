using System;
using System.Linq;
using backend.Requests;

namespace backend.integration.Good
{
    public static class Requests
    {
        private static readonly Random rand = new Random();

        public static CreateLineRequest line => new CreateLineRequest
        {
            brushColor = "#000",
            brushRadius = 10,
            points = Enumerable.Repeat(Good.Models.point, 1000).ToArray()
        };
    }
}