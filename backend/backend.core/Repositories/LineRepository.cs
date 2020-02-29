using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using backend.Models;
using Dapper;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
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
            SqlMapper.AddTypeHandler(new GeometryHandler<LineString>());
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
            var insertedId = _colorDbConnection.QueryFirstOrDefault(@"
            INSERT INTO line (geom, brush_width, brush_color)
            VALUES (ST_SetSRID(@geom, 4326),@brushWidth,@brushColor)            
", new
            {
                geom = line.geom.ToString(),
                line.brushColor,
                line.brushWidth
            });

            return getById(1);
        }

        public IEnumerable<Line2> getAll()
        {
            return _colorDbConnection.Query<Line2>(@"
SELECT line_id as lineId, geom, brush_color as brushColor, brush_width as brushWidth
FROM line;
");
        }

        private class GeometryHandler<T> : SqlMapper.TypeHandler<T>
            where T : Geometry
        {
            private readonly PostGisReader _reader;
            private readonly PostGisWriter _writer;

            public GeometryHandler()
            {
                _writer = new PostGisWriter {HandleOrdinates = Ordinates.XY};
                _reader = new PostGisReader {HandleOrdinates = Ordinates.XY};
            }

            public override T Parse(object value)
            {
                return (T) _reader.Read(((T) value).AsBinary());
            }

            public override void SetValue(IDbDataParameter parameter, T value)
            {
                parameter.Value = _writer.Write(value);

                ((SqlParameter) parameter).SqlDbType = SqlDbType.Udt;
                ((SqlParameter) parameter).UdtTypeName = "geometry";
            }
        }
    }
}