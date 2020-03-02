using System.Collections.Generic;
using System.Data;
using backend.core.Commands;
using backend.Models;
using Dapper;

namespace backend.Repositories
{
    public interface IPlayerRepository
    {
        Player getById(int id);
        Player insert(PlayerCmd player);
        IEnumerable<Player> getAll();
    }

    public class PlayerRepository : IPlayerRepository
    {
        private readonly IDbConnection _colorDbConnection;

        public PlayerRepository(IDbConnection colorDbConnection)
        {
            _colorDbConnection = colorDbConnection;
        }

        public Player getById(int id)
        {
            return _colorDbConnection.QueryFirstOrDefault<Player>(
                @"
                    SELECT * 
                    FROM player
                    WHERE player_id = @playerId;
                ", new
                {
                    playerId = id
                });
        }

        public Player insert(PlayerCmd player)
        {
            var playerId = _colorDbConnection.QueryFirst<int>(
                @"
                    INSERT INTO player (name)
                    VALUES (@name)
                    RETURNING player_id
                ",
                player);
            return getById(playerId);
        }

        public IEnumerable<Player> getAll()
        {
            return _colorDbConnection.Query<Player>(
                @"
                    SELECT player_id as playerId, name 
                    FROM player;
                "
            );
        }
    }
}