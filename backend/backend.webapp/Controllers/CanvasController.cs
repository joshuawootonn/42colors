using System.Linq;
using backend.core.Repositories;
using backend.Requests;
using backend.Views;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    public class CanvasController : ControllerBase
    {
        private readonly ILineRepository _lineRepository;
        private readonly ILogger<CanvasController> _logger;

        public CanvasController(ILogger<CanvasController> logger, ILineRepository lineRepository)
        {
            _logger = logger;
            _lineRepository = lineRepository;
        }

        [HttpPost("api/line")]
        public IActionResult postLine([FromBody] LineRequest lineRequest)
        {
            var line = _lineRepository.insert(lineRequest.toCmd());
            return Ok(new LineViewModel(line));
        }

        [HttpGet]
        [Route("/api/lines")]
        public IActionResult getAllLines()
        {
            var lines = _lineRepository.getAll().ToArray();
            _logger.LogInformation($"found {lines.Length} lines");
            return Ok(new LinesViewModel(lines));
        }

        private class PositionQuery
        {
            private int x { get; set; }
            private int y { get; set; }
            private int w { get; set; }
            private int h { get; set; }
        }
        
    }
}