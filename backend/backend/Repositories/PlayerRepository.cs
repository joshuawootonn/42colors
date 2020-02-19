using System.Data;
using backend.Models;
using backend.Requests;
using Dapper;

namespace backend.Repositories
{
    public interface IPlayerRepository
    {
        Player getById(int id);
        int insert(CreatePlayerRequest player);
    }
    public class PlayerRepository: IPlayerRepository
    {
        private readonly IDbConnection _colorDbConnection;

        public PlayerRepository(IDbConnection _colorDbConnection)
        {
            this._colorDbConnection = _colorDbConnection;
        }


        public Player getById(int id)
        {
            throw new System.NotImplementedException();
        }

        public int insert(CreatePlayerRequest player)
        {
            var aaa = _colorDbConnection.Execute(@"
INSERT INTO player (name)
VALUES (@name)
RETURNING id;
", player);

            return aaa;
        }
    }
}