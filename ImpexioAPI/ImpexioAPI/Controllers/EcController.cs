using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EcController : ControllerBase
    {
        private readonly EcRepository _repo;

        public EcController(EcRepository repo)
        {
            _repo = repo;
        }

        // ── GET ALL ──────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var records = await _repo.GetAllAsync();
                return Ok(new { success = true, data = records });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── GET BY ID ────────────────────────────────────────
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var record = await _repo.GetByIdAsync(id);
                if (record == null)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, data = record });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── INSERT ───────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EcRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                if (string.IsNullOrWhiteSpace(dto.RatesDate))
                    return BadRequest(new { success = false, message = "Rates Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "EC record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] EcRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RefNo))
                    return BadRequest(new { success = false, message = "Ref No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EC record updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── DELETE ───────────────────────────────────────────
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var ok = await _repo.DeleteAsync(id);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EC record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static EcRecord MapToModel(EcRecordDto dto)
        {
            return new EcRecord
            {
                RefNo = dto.RefNo,
                RatesDate = DateTime.TryParse(dto.RatesDate, out var d) ? d : DateTime.Today,
                Company = dto.Company,
                Product = dto.Product,
                UsdRate = dto.UsdRate,
                ShipRate = dto.ShipRate,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                SumFobInr = dto.SumFobInr,
                SumFobUsd = dto.SumFobUsd,
                SumCifInr = dto.SumCifInr,
                SumCifUsd = dto.SumCifUsd,
                Cells = dto.Cells.Select(c => new EcCell
                {
                    RowKey = c.RowKey,
                    ColId = c.ColId,
                    Mode = c.Mode,
                    Value = c.Value
                }).ToList()
            };
        }
    }
}