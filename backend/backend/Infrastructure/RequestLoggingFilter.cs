using backend.Utils;
using Microsoft.AspNetCore.Mvc.Filters;
using NLog;

namespace backend.Infrastructure
{
    public sealed class RequestLoggingFilter : IResourceFilter
    {
        private static readonly Logger logger = LogManager.GetLogger(nameof(RequestLoggingFilter));

        public void OnResourceExecuting(ResourceExecutingContext context)
        {
            var httpContext = context.HttpContext;
            var request = httpContext.Request;

            logger.Log(
                LogLevel.Info,
                $@"{request.Method} {request.Path} {httpContext.formatQueryString()}");

            logger.Debug($@"{httpContext.TraceIdentifier}
headers: {httpContext.formatHeaders()}
query: {httpContext.formatQueryString()}");
        }

        public void OnResourceExecuted(ResourceExecutedContext context)
        {
            var httpContext = context.HttpContext;
            logger.Log(
                LogLevel.Info,
                $@"<-- {httpContext.Response.StatusCode}");
        }
    }
}