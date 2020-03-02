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
            this._textWriter = TestExecutionContext.CurrentContext.OutWriter;
            this.Name = name;
        }
        
        protected override void Write(LogEventInfo logEvent)
        {
            var renderedLogEvent = this.RenderLogEvent(this.Layout, logEvent);
            lock (_writeLock)
            {
                _textWriter.WriteLine(renderedLogEvent);
            }
        }
    }
}