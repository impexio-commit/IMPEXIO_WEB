using Dapper;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly DbConnectionFactory _db;
        public DashboardController(DbConnectionFactory db) { _db = db; }

        private string ClientCode =>
            User.FindFirstValue("ClientCode") ?? "";

        // ── GET Summary ───────────────────────────────────────
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                using var conn = _db.CreateConnection();
                var data = await conn.QueryFirstOrDefaultAsync(
                    "SP_Dashboard_GetSummary",
                    new { ClientCode },
                    commandType: CommandType.StoredProcedure);

                if (data == null)
                    return Ok(new { success = true, data = new { } });

                var dict = (IDictionary<string, object>)data;

                int cbm = Convert.ToInt32(dict["CbmCount"]);
                int fob = Convert.ToInt32(dict["FobCount"]);
                int ec = Convert.ToInt32(dict["EcCount"]);
                int ec2 = Convert.ToInt32(dict["Ec2Count"]);
                int pi = Convert.ToInt32(dict["PiCount"]);
                int eq = Convert.ToInt32(dict["EqCount"]);
                int sci = Convert.ToInt32(dict["SciCount"]);
                int ile = Convert.ToInt32(dict["IleCount"]);
                int efm = Convert.ToInt32(dict["EfmCount"]);
                int bil = Convert.ToInt32(dict["BilCount"]);
                int total = cbm + fob + ec + ec2 + pi + eq + sci + ile + efm + bil;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalDocuments = total,
                        totalCbm = Convert.ToDecimal(dict["TotalCbm"]),
                        totalFob = Convert.ToDecimal(dict["TotalFob"]),
                        thisMonthDocs = Convert.ToInt32(dict["CbmThisMonth"])
                                        + Convert.ToInt32(dict["PiThisMonth"])
                                        + Convert.ToInt32(dict["EqThisMonth"]),
                        moduleWise = new[]
                        {
                            new { name="CBM Calculation",   count=cbm,  icon="📦" },
                            new { name="FOB Expenses",       count=fob,  icon="🚢" },
                            new { name="Export Costing",     count=ec,   icon="💰" },
                            new { name="Export Costing 2",   count=ec2,  icon="💹" },
                            new { name="Proforma Invoice",   count=pi,   icon="📄" },
                            new { name="Export Quotation",   count=eq,   icon="📋" },
                            new { name="Courier Invoice",    count=sci,  icon="📦" },
                            new { name="Letter of Enquiry",  count=ile,  icon="📨" },
                            new { name="Follow-up Mail",     count=efm,  icon="📧" },
                            new { name="Buyer Intro Letter", count=bil,  icon="🤝" }
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── GET Recent Activity ───────────────────────────────
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent()
        {
            try
            {
                using var conn = _db.CreateConnection();
                var rows = await conn.QueryAsync(
                    "SP_Dashboard_GetRecent",
                    new { ClientCode },
                    commandType: CommandType.StoredProcedure);

                var list = rows.Select(r =>
                {
                    var d = (IDictionary<string, object>)r;
                    return new
                    {
                        module = d["Module"]?.ToString(),
                        docNo = d["DocNo"]?.ToString(),
                        party = d["Party"]?.ToString(),
                        createdAt = d["CreatedAt"]?.ToString()
                    };
                }).ToList();

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}