using System.Linq;
using System.Threading.Tasks;
using backend.core.Repositories;
using backend.Requests;
using backend.Views;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace backend.Hubs
{
    public class LineHub: Hub
    {
        private readonly ILogger<LineHub> _logger;
        private readonly ILineRepository _lineRepository;

        public LineHub(ILogger<LineHub> logger, ILineRepository lineRepository)
        {
            _logger = logger;
            _lineRepository = lineRepository;
        }
        public override async Task OnConnectedAsync()
        { 
            await Groups.AddToGroupAsync(Context.ConnectionId, "signalR");
            await base.OnConnectedAsync();
            return;
        }

        public Task sendLine(LineRequest lineRequest)
        {
            var line = _lineRepository.insert(lineRequest.toCmd());
            return Clients.All.SendAsync("receiveLine", new LineViewModel(line));
        }
        
        public Task getLines()
        {
            var lines = _lineRepository.getAll().ToArray();
            _logger.LogInformation($"found {lines.Length} lines");
            return Clients.All.SendAsync("receiveLines",new LinesViewModel(lines));
        }
    }
}