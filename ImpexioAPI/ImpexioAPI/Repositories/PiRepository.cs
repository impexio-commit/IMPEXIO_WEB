using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class PiRepository
    {
        private readonly DbConnectionFactory _db;

        public PiRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<PiRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<PiRecord>(
                "SP_PI_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Rows = (await conn.QueryAsync<PiRow>(
                    "SP_PI_GetRows",
                    new { PiRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<PiRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<PiRecord>(
                "SP_PI_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Rows = (await conn.QueryAsync<PiRow>(
                "SP_PI_GetRows",
                new { PiRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(PiRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_PI_Insert",
                    new
                    {
                        rec.PiNo,
                        rec.PiDate,
                        rec.ExpName,
                        rec.ExpAddr1,
                        rec.ExpAddr2,
                        rec.ExpAddr3,
                        rec.BuyName,
                        rec.BuyAddr1,
                        rec.BuyAddr2,
                        rec.BuyAddr3,
                        rec.CountryOrigin,
                        rec.CountryDest,
                        rec.Pol,
                        rec.Pod,
                        rec.Precarriage,
                        rec.Vessel,
                        rec.Incoterms,
                        rec.FinalDest,
                        rec.PaymentTerms,
                        rec.DeliveryTerms,
                        rec.Transhipment,
                        rec.PartialShipment,
                        rec.LeadTime,
                        rec.Validity,
                        rec.NetGrossWt,
                        rec.TotalCbm,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
                        rec.TotBox,
                        rec.TotAmt,
                        rec.AmtWords
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                // Insert product rows
                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_PI_InsertRow",
                        new
                        {
                            PiRecordId = newId,
                            SortOrder = i,
                            row.Desc,
                            row.Hs,
                            row.Qty,
                            row.Box,
                            row.Rate,
                            row.Amt
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                tx.Commit();
                return newId;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        // ── UPDATE ───────────────────────────────────────────
        public async Task<bool> UpdateAsync(int id, PiRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_PI_Update",
                    new
                    {
                        Id = id,
                        rec.PiNo,
                        rec.PiDate,
                        rec.ExpName,
                        rec.ExpAddr1,
                        rec.ExpAddr2,
                        rec.ExpAddr3,
                        rec.BuyName,
                        rec.BuyAddr1,
                        rec.BuyAddr2,
                        rec.BuyAddr3,
                        rec.CountryOrigin,
                        rec.CountryDest,
                        rec.Pol,
                        rec.Pod,
                        rec.Precarriage,
                        rec.Vessel,
                        rec.Incoterms,
                        rec.FinalDest,
                        rec.PaymentTerms,
                        rec.DeliveryTerms,
                        rec.Transhipment,
                        rec.PartialShipment,
                        rec.LeadTime,
                        rec.Validity,
                        rec.NetGrossWt,
                        rec.TotalCbm,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
                        rec.TotBox,
                        rec.TotAmt,
                        rec.AmtWords
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old rows and reinsert
                await conn.ExecuteAsync(
                    "SP_PI_DeleteRows",
                    new { PiRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_PI_InsertRow",
                        new
                        {
                            PiRecordId = id,
                            SortOrder = i,
                            row.Desc,
                            row.Hs,
                            row.Qty,
                            row.Box,
                            row.Rate,
                            row.Amt
                        },
                        transaction: tx,
                        commandType: CommandType.StoredProcedure);
                }

                tx.Commit();
                return true;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        // ── DELETE ───────────────────────────────────────────
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var rows = await conn.ExecuteAsync(
                "SP_PI_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}