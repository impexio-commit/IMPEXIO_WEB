using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SciController : ControllerBase
    {
        private readonly SciRepository _repo;

        public SciController(SciRepository repo)
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
        public async Task<IActionResult> Create([FromBody] SciRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.InvNo))
                    return BadRequest(new { success = false, message = "Invoice No is required." });

                if (string.IsNullOrWhiteSpace(dto.InvDate))
                    return BadRequest(new { success = false, message = "Invoice Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "SCI record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SciRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.InvNo))
                    return BadRequest(new { success = false, message = "Invoice No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "SCI record updated successfully." });
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

                return Ok(new { success = true, message = "SCI record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static SciRecord MapToModel(SciRecordDto dto)
        {
            return new SciRecord
            {
                InvNo = dto.InvNo,
                InvDate = DateTime.TryParse(dto.InvDate, out var d) ? d : DateTime.Today,
                ConName = dto.ConName,
                ConAddr1 = dto.ConAddr1,
                ConAddr2 = dto.ConAddr2,
                ConAddr3 = dto.ConAddr3,
                NotName = dto.NotName,
                NotAddr1 = dto.NotAddr1,
                NotAddr2 = dto.NotAddr2,
                NotAddr3 = dto.NotAddr3,
                CountryOrigin = dto.CountryOrigin,
                CountryDest = dto.CountryDest,
                Pol = dto.Pol,
                Pod = dto.Pod,
                FinalDest = dto.FinalDest,
                Vessel = dto.Vessel,
                Precarriage = dto.Precarriage,
                PlaceReceipt = dto.PlaceReceipt,
                DeliveryTerms = dto.DeliveryTerms,
                PaymentTerms = dto.PaymentTerms,
                Incoterms = dto.Incoterms,
                OtherTerms = dto.OtherTerms,
                MarksNos = dto.MarksNos,
                GrossNetWt = dto.GrossNetWt,
                OtherRef = dto.OtherRef,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                TotQty = dto.TotQty,
                TotAmt = dto.TotAmt,
                AmtWords = dto.AmtWords,
                Rows = dto.Rows.Select((r, i) => new SciRow
                {
                    SortOrder = i,
                    Description = r.Description,
                    Hs = r.Hs,
                    Qty = r.Qty,
                    Rate = r.Rate,
                    Amt = r.Amt
                }).ToList()
            };
        }
    }
}