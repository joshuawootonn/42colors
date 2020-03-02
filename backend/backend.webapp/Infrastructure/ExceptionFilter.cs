using backend.Utils;
using Microsoft.AspNetCore.Mvc.Filters;
using NLog;

namespace backend.Infrastructure
{
    // ReSharper disable once ClassNeverInstantiated.Global
    public class ExceptionFilter : IExceptionFilter
    {
        private static readonly Logger logger = LogManager.GetLogger(nameof(Program));

        public void OnException(ExceptionContext context)
        {
            var httpContext = context.HttpContext;

            context.ExceptionHandled = true;
            httpContext.Response.StatusCode = 500;

            logger.Error($@"An unexpected error occurred:            
method: {httpContext.Request.Method}
path: {httpContext.Request.Path}
headers: {httpContext.formatHeaders()}
query: {httpContext.formatQueryString()}
exception: {context.Exception}");
        }
    }
}