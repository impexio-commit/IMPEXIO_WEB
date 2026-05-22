using ImpexioAPI.DTOs;
using ImpexioAPI.Models;
using ImpexioAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ImpexioAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EqController : ControllerBase
    {
        private readonly EqRepository _repo;

        public EqController(EqRepository repo)
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
        public async Task<IActionResult> Create([FromBody] EqRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.QuotNo))
                    return BadRequest(new { success = false, message = "Quot. No is required." });

                if (string.IsNullOrWhiteSpace(dto.QuotDate))
                    return BadRequest(new { success = false, message = "Quot. Date is required." });

                var record = MapToModel(dto);
                var newId = await _repo.InsertAsync(record);

                return Ok(new { success = true, message = "EQ record created successfully.", data = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] EqRecordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.QuotNo))
                    return BadRequest(new { success = false, message = "Quot. No is required." });

                var record = MapToModel(dto);
                var ok = await _repo.UpdateAsync(id, record);

                if (!ok)
                    return NotFound(new { success = false, message = "Record not found." });

                return Ok(new { success = true, message = "EQ record updated successfully." });
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

                return Ok(new { success = true, message = "EQ record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── MAP DTO TO MODEL ─────────────────────────────────
        private static EqRecord MapToModel(EqRecordDto dto)
        {
            return new EqRecord
            {
                QuotNo = dto.QuotNo,
                QuotDate = DateTime.TryParse(dto.QuotDate, out var d) ? d : DateTime.Today,
                Product = dto.Product,
                Buyer = dto.Buyer,
                Country = dto.Country,
                Pol = dto.Pol,
                Pod = dto.Pod,
                Incoterms = dto.Incoterms,
                FinalDest = dto.FinalDest,
                DeliveryTime = dto.DeliveryTime,
                ShipmentType = dto.ShipmentType,
                PaymentTerms = dto.PaymentTerms,
                Validity = dto.Validity,
                Packaging = dto.Packaging,
                ContainerSize = dto.ContainerSize,
                PackedDim = dto.PackedDim,
                InnerPack = dto.InnerPack,
                PackedWeight = dto.PackedWeight,
                MasterPack = dto.MasterPack,
                Sample = dto.Sample,
                SpecialInst = dto.SpecialInst,
                OtherDesc = dto.OtherDesc,
                Remarks = dto.Remarks,
                PreparedBy = dto.PreparedBy,
                Signatory = dto.Signatory,
                TotQty = dto.TotQty,
                TotAmt = dto.TotAmt,
                Rows = dto.Rows.Select((r, i) => new EqRow
                {
                    SortOrder = i,
                    Desc = r.Desc,
                    Hs = r.Hs,
                    Qty = r.Qty,
                    Rate = r.Rate,
                    Amt = r.Amt
                }).ToList()
            };
        }
    }
}