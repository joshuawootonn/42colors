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
            SqlMapper.AddTypeHandler(new GeometryHandler<LineString>(geography: false));
            _colorDbConnection = colorDbConnection;
        }

        public Line2 getById(int id)
        {
            // SELECT 
            using (var cmd = new NpgsqlCommand(@"
            SELECT line_id as lineId, geom, brush_color as brushColor, brush_width as brushWidth
            FROM line", _colorDbConnection))
            using (var reader = cmd.ExecuteReader())
            {
                reader.Read();
                // var stringLineString = (string) reader[1];
                // var geometry = new WKTReader().Read(stringLineString);
                // var lineString = new LineString(geometry.Coordinates);

                return new Line2
                {
                    lineId = (int) reader[0],
                    geom = (LineString) reader[1],
                    brushColor = (string) reader[2],
                    brushWidth = (int) reader[3]
                };
            }
        }

        public Line2 insert(Line2 line)
        {
            var cmd = new NpgsqlCommand(@"
            INSERT INTO line (geom, brush_width, brush_color)
            VALUES (ST_SetSRID(@geom, 4326), @brushWidth,@brushColor)
            RETURNING line_id;
            ", _colorDbConnection);
            cmd.Parameters.AddWithValue("@geom", line.geom);
            cmd.Parameters.AddWithValue("@brushWidth", line.brushWidth);
            cmd.Parameters.AddWithValue("@brushColor", line.brushColor);
            var aaa = cmd.ExecuteReader();
            aaa.Read();
            var bbb = (int) aaa[0];
            var insertedId = bbb;
            cmd.Cancel();
            cmd.Dispose();
            aaa.Dispose();
            return getById(insertedId);
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
            private readonly bool _geography;
            private readonly PostGisWriter _writer;
            private readonly PostGisReader _reader;

            public GeometryHandler(bool geography = false)
            {
                _geography = geography;
                _writer = new PostGisWriter { HandleOrdinates = Ordinates.XY };
                _reader = new PostGisReader { HandleOrdinates = Ordinates.XY };
            }

            public override T Parse(object value)
                => (T)_reader.Read(((T)value).AsBinary());

            public override void SetValue(IDbDataParameter parameter, T value)
            {
                parameter.Value = _writer.Write(value);

                ((SqlParameter)parameter).SqlDbType = SqlDbType.Udt;
                ((SqlParameter)parameter).UdtTypeName = _geography ? "geography" : "geometry";
            }
        }
    }
}