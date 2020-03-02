using System.Linq;
using backend.Repositories;
using backend.Requests;
using backend.Views;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ILogger = NLog.ILogger;

namespace backend.Controllers
{
    [ApiController]
    public class CanvasController : ControllerBase
    {
        private readonly ILogger<CanvasController> _logger;
        private readonly ILineRepository _lineRepository;

        public CanvasController(ILogger<CanvasController> logger,  ILineRepository lineRepository)
        {
            _logger = logger;
            _lineRepository = lineRepository;
        }

        [HttpPost("api/line")]
        public IActionResult postLine([FromBody] LineRequest lineRequest)
        {
            _lineRepository.insert(lineRequest.toCmd());
            return Ok();
        }

        [HttpGet]
        [Route("/api/lines")]
        public IActionResult getAllLines()
        {
            var lines = _lineRepository.getAll().ToArray();
            _logger.LogInformation($"found {lines.Length} lines");
            return Ok(new LinesViewModel(lines));
        }
    }
}