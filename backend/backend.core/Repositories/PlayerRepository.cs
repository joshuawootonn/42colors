using System.Collections.Generic;
using System.Data;
using backend.Models;
using backend.Requests;
using Dapper;

namespace backend.Repositories
{
    public interface IPlayerRepository
    {
        Player getById(int id);
        Player insert(CreatePlayerRequest player);

        IEnumerable<Player> getAll();
    }

    public class PlayerRepository : IPlayerRepository
    {
        private readonly IDbConnection _colorDbConnection;

        public PlayerRepository(IDbConnection _colorDbConnection)
        {
            this._colorDbConnection = _colorDbConnection;
        }


        public Player getById(int id)
        {
            return _colorDbConnection.QueryFirstOrDefault<Player>(@"
SELECT * 
FROM player
WHERE player_id = @playerId;
", new {playerId = id});
        }

        public Player insert(CreatePlayerRequest player)
        {
            var playerId = _colorDbConnection.QueryFirst<int>(@"
INSERT INTO player (name)
VALUES (@name)
RETURNING player_id
", player);
            return getById(playerId);
        }

        public IEnumerable<Player> getAll()
        {
            return _colorDbConnection.Query<Player>(@"
SELECT player_id as playerId, name 
FROM player;
");
        }
    }
}