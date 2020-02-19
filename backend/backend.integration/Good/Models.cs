using System;
using backend.Models;

namespace backend.integration.Good
{
    public static class Models
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
    }
    
}