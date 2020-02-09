using System.Collections.Generic;
using backend.Models;
using backend.Requests;
using backend.Views;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    public class CanvasController : ControllerBase
    {
        private static readonly List<Line> _lines = new List<Line>();

        private readonly ILogger<CanvasController> _logger;

        public CanvasController(ILogger<CanvasController> logger)
        {
            _logger = logger;
        }

        [HttpPost("api/line")]
        public IActionResult postLine([FromBody] CreateLineRequest lineRequest)
        {
            _lines.Add(lineRequest.toLine());
            return Ok();
        }

        [HttpGet]
        [Route("/api/lines")]
        public IActionResult getAllLines()
        {
            return Ok(new GetLinesView(_lines));
        }
    }
}