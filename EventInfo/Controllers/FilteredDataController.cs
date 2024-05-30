using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using EventInfo.Services;
using System.Linq;

namespace EventInfo.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class FilteredDataController : ControllerBase
    {
        private readonly MqttService _mqttService;

        public FilteredDataController(MqttService mqttService)
        {
            _mqttService = mqttService;
        }

        [HttpGet("AbnormalProduction")]
        public async Task<ActionResult<IEnumerable<object>>> GetAbnormalProduction()
        {
            var filteredData = await _mqttService.GetFilteredData("abnormalProduction");
            if (filteredData == null || !filteredData.Any())
            {
                return NotFound("Nema dostupnih podataka za tip abnormalne proizvodnje.");
            }
            return Ok(filteredData);
        }

        [HttpGet("ProductionConsumption")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductionConsumption()
        {
            var filteredData = await _mqttService.GetFilteredData("productionConsumption");
            if (filteredData == null || !filteredData.Any())
            {
                return NotFound("Nema dostupnih podataka za tip proizvodnje i potrošnje.");
            }
            return Ok(filteredData);
        }

        [HttpGet("AnyZeroValue")]
        public async Task<ActionResult<IEnumerable<object>>> GetAnyZeroValue()
        {
            var filteredData = await _mqttService.GetFilteredData("anyZeroValue");
            if (filteredData == null || !filteredData.Any())
            {
                return NotFound("Nema dostupnih podataka za tip bilo koje nule.");
            }
            return Ok(filteredData);
        }

        [HttpGet("ConsumptionDifference")]
        public async Task<ActionResult<IEnumerable<object>>> GetConsumptionDifference()
        {
            var filteredData = await _mqttService.GetFilteredData("consumptionDifference");
            if (filteredData == null || !filteredData.Any())
            {
                return NotFound("Nema dostupnih podataka za razliku u potrošnji.");
            }
            return Ok(filteredData);
        }
    }
}
