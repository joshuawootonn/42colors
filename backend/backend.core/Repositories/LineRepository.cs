using System.Collections.Generic;
using backend.Models;
using Dapper;
using Npgsql;

namespace backend.Repositories
{
    public interface ILineRepository
    {
        Line2 getById(int id);

        Line2 insert(Line2 line);

        IEnumerable<Line2> getAll();
    }

    public class LineRepository : ILineRepository
    {
        private readonly NpgsqlConnection _colorDbConnection;

        public LineRepository(NpgsqlConnection colorDbConnection)
        {
            _colorDbConnection = colorDbConnection;
        }

        public Line2 getById(int id)
        {
            return _colorDbConnection.QueryFirstOrDefault<Line2>(
                @"
                    SELECT line_id as lineId, geom, brush_color as brushColor, brush_width as brushWidth
                    FROM line
                    WHERE line_id = @id;
                ",
                new
                {
                    id
                });
        }

        public Line2 insert(Line2 line)
        {
            var insertedId = _colorDbConnection.QueryFirst<int>(
                @"
                    INSERT INTO line (geom, brush_width, brush_color)
                    VALUES (ST_SetSRID(@geom, 4326),@brushWidth,@brushColor)      
                    RETURNING line_id          
                ",
                new
                {
                    geom = line.geom.ToString(),
                    line.brushColor,
                    line.brushWidth
                });

            return getById(insertedId);
        }

        public IEnumerable<Line2> getAll()
        {
            return _colorDbConnection.Query<Line2>(
                @"
                    SELECT line_id as lineId, geom, brush_color as brushColor, brush_width as brushWidth
                    FROM line;
                ");
        }

    }
}