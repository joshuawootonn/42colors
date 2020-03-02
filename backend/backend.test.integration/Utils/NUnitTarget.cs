using System.IO;
using NLog;
using NLog.Targets;
using NUnit.Framework.Internal;

namespace backend.integration.Utils
{
    public class NUnitTarget : TargetWithLayout
    {
        private readonly TextWriter _textWriter;

        private readonly object _writeLock = new object();

        public NUnitTarget(string name)
        {
            _textWriter = TestExecutionContext.CurrentContext.OutWriter;
            Name = name;
        }

        protected override void Write(LogEventInfo logEvent)
        {
            var renderedLogEvent = RenderLogEvent(Layout, logEvent);
            lock (_writeLock)
            {
                _textWriter.WriteLine(renderedLogEvent);
            }
        }
    }
}