using System.Collections.Generic;
using System.Net;

namespace backend.integration.Utils
{
    public class Response<T>
    {
        public IDictionary<string, string[]> errors;
        public T model { get; set; }
        public string content { get; set; }
        public int statusCode { get; set; }
    }
}