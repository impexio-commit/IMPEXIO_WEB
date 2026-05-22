using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PiController : ControllerBase
    {
        private readonly PiRepository _repo;

        public PiController(PiRepository repo)
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
        public async Task<IActionResult> Create([FromBody] PiRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.PiNo))
                    return BadRequest(new { success = false, message = "PI No is required." });

                if (string.IsNullOrWhiteSpace(dto.PiDate))
                    return BadRequest(new { success = false, message = "PI Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "PI record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PiRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.PiNo))
                    return BadRequest(new { success = false, message = "PI No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "PI record updated successfully." });
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

                return Ok(new { success = true, message = "PI record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static PiRecord MapToModel(PiRecordDto dto)
        {
            return new PiRecord
            {
                PiNo = dto.PiNo,
                PiDate = DateTime.TryParse(dto.PiDate, out var d) ? d : DateTime.Today,
                ExpName = dto.ExpName,
                ExpAddr1 = dto.ExpAddr1,
                ExpAddr2 = dto.ExpAddr2,
                ExpAddr3 = dto.ExpAddr3,
                BuyName = dto.BuyName,
                BuyAddr1 = dto.BuyAddr1,
                BuyAddr2 = dto.BuyAddr2,
                BuyAddr3 = dto.BuyAddr3,
                CountryOrigin = dto.CountryOrigin,
                CountryDest = dto.CountryDest,
                Pol = dto.Pol,
                Pod = dto.Pod,
                Precarriage = dto.Precarriage,
                Vessel = dto.Vessel,
                Incoterms = dto.Incoterms,
                FinalDest = dto.FinalDest,
                PaymentTerms = dto.PaymentTerms,
                DeliveryTerms = dto.DeliveryTerms,
                Transhipment = dto.Transhipment,
                PartialShipment = dto.PartialShipment,
                LeadTime = dto.LeadTime,
                Validity = dto.Validity,
                NetGrossWt = dto.NetGrossWt,
                TotalCbm = dto.TotalCbm,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                TotQty = dto.TotQty,
                TotBox = dto.TotBox,
                TotAmt = dto.TotAmt,
                AmtWords = dto.AmtWords,
                Rows = dto.Rows.Select((r, i) => new PiRow
                {
                    SortOrder = i,
                    Desc = r.Desc,
                    Hs = r.Hs,
                    Qty = r.Qty,
                    Box = r.Box,
                    Rate = r.Rate,
                    Amt = r.Amt
                }).ToList()
            };
        }
    }
}