using System.Collections.Generic;
using System.Data;
using backend.core.Commands;
using backend.core.Models;
using Dapper;

namespace backend.core.Repositories
{
    public interface ILineRepository
    {
        Line getById(int id);

        Line insert(LineCmd line);

        IEnumerable<Line> getAll();
    }

    public class LineRepository : ILineRepository
    {
        private readonly IDbConnection _colorDbConnection;

        public LineRepository(IDbConnection colorDbConnection)
        {
            _colorDbConnection = colorDbConnection;
        }

        public Line getById(int id)
        {
            return _colorDbConnection.QueryFirstOrDefault<Line>(
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

        public Line insert(LineCmd line)
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

        public IEnumerable<Line> getAll()
        {
            return _colorDbConnection.Query<Line>(
                @"
                    SELECT line_id as lineId, geom, brush_color as brushColor, brush_width as brushWidth
                    FROM line;
                ");
        }
    }
}