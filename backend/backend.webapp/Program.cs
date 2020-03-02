using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NLog;
using NLog.Web;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace backend
{
    public class Program
    {
        private static readonly Logger logger = LogManager.GetLogger(nameof(Program));

        public static void Main(string[] args)
        {
            CreateHostBuilder<Startup>(args).Build().Run();
        }

        public static IWebHostBuilder CreateHostBuilder<TStartup>(string[] args) where TStartup : Startup
        {
            return WebHost.CreateDefaultBuilder(args)
                .UseStartup<TStartup>()
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.SetMinimumLevel(LogLevel.Information);

                    logger.Info("Welcome to 42Colors!");
                }).UseNLog().ConfigureAppConfiguration(configurationBuilder =>
                    configurationBuilder.AddEnvironmentVariables(prefix: "COLOR_"));
            ;
        }
    }
}