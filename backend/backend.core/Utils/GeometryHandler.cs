using System.Data;
using System.Data.SqlClient;
using Dapper;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

namespace backend.core.Utils
{
    public class GeometryHandler<T> : SqlMapper.TypeHandler<T>
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