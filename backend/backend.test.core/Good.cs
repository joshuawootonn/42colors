using System;
using System.Linq;
using backend.Models;
using backend.Requests;

namespace backend.test.core
{
    public static class Good
    {
        private static readonly Random rand = new Random();

        public static Point point => new Point
        {
            x = rand.Next(1, 1000),
            y = rand.Next(1, 1000)
        };

        public static Player player => new Player
        {
            player_id = 1,
            name = "asdf1234"
        };
        
        public static CreateLineRequest line => new CreateLineRequest
        {
            brushColor = "#000",
            brushRadius = 10,
            points = Enumerable.Repeat(point, 1000).ToArray()
        };

        public static CreatePlayerRequest createPlayerRequest => new CreatePlayerRequest
        {
            name = "asdf1234"
        };
    }
}