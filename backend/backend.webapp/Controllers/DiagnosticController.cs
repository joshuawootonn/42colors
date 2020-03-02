using System;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ILogger = NLog.ILogger;

namespace backend.Controllers
{
    [ApiController]
    public class DiagnosticController : ControllerBase
    {
        private readonly IDbConnection _colorConnection;
        
        private readonly ILogger<CanvasController> _logger;

        public DiagnosticController(ILogger<CanvasController> logger, IDbConnection colorConnection)
        {
            _logger = logger;
            _colorConnection = colorConnection;
        }

        [HttpGet("/api/diagnostic/ok")]
        public IActionResult postLine()
        {
            return Ok();
        }

        [HttpGet]
        [Route("api/diagnostic/error")]
        public IActionResult getAllLines()
        {
            throw new Exception("oops");
            // return StatusCode((int) HttpStatusCode.ServiceUnavailable);
        }
        
        
        [HttpGet]
        [Route("api/diagnostic/database")]
        public IActionResult getDatabaseStatus()
        {
            return Ok(new
            {
                status = _colorConnection.State
            });
        }
    }
}