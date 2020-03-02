using System;
using backend.Infrastructure;
using backend.integration.Utils;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NLog.Config;
using NLog.Targets;
using NLog.Web;

namespace backend.integration.Services
{
    public class TestApplicationFactory : WebApplicationFactory<Startup>
    {
        private readonly LoggingConfiguration _loggingConfiguration;

        public TestApplicationFactory()
        {
            var (loggingConfiguration, memoryTarget) =
                createMemoryTargetLoggingConfiguration(Console.DoNotWriteRequestLogging);
            target = memoryTarget;
            _loggingConfiguration = loggingConfiguration;
        }

        public MemoryTarget target { get; }

        private static (LoggingConfiguration loggingConfiguration, MemoryTarget memoryTarget)
            createMemoryTargetLoggingConfiguration(Console console)
        {
            var configuration = new LoggingConfiguration();
            var target = new MemoryTarget("testApplicationMemoryTarget");
            configuration.AddRuleForAllLevels(target);

            var nUnitTarget = new NUnitTarget("testApplicationConsoleTarget")
            {
                Layout =
                    "${longdate} ${level:uppercase=true} [${pad:inner=${aspnet-traceidentifier}:padding=20:fixedLength=true:alignmentOnTruncation=Right}]#${threadid} | ${mdlc:context}${message} ${exception:format=tostring}"
            };
            if (console == Console.DoNotWriteRequestLogging)
                configuration.AddRuleForAllLevels(new NullTarget(), nameof(RequestLoggingFilter), true);
            configuration.AddRuleForAllLevels(nUnitTarget);

            return (configuration, target);
        }

        protected override IWebHostBuilder CreateWebHostBuilder()
        {
            var builder = Program.CreateHostBuilder<Startup>(Array.Empty<string>());

            return builder
                .ConfigureLogging(logging => logging
                    .ClearProviders()
                    .AddNLog(_loggingConfiguration))
                .ConfigureAppConfiguration(configurationBuilder =>
                    configurationBuilder.AddEnvironmentVariables("COLOR_"));
        }

        private enum Console
        {
            DoNotWriteRequestLogging,
            WriteRequestLogging
        }
    }
}