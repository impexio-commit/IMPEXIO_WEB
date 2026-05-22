using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class SciRepository
    {
        private readonly DbConnectionFactory _db;

        public SciRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<SciRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<SciRecord>(
                "SP_SCI_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Rows = (await conn.QueryAsync<SciRow>(
                    "SP_SCI_GetRows",
                    new { SciRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<SciRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<SciRecord>(
                "SP_SCI_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Rows = (await conn.QueryAsync<SciRow>(
                "SP_SCI_GetRows",
                new { SciRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(SciRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_SCI_Insert",
                    new
                    {
                        rec.InvNo,
                        rec.InvDate,
                        rec.ConName,
                        rec.ConAddr1,
                        rec.ConAddr2,
                        rec.ConAddr3,
                        rec.NotName,
                        rec.NotAddr1,
                        rec.NotAddr2,
                        rec.NotAddr3,
                        rec.CountryOrigin,
                        rec.CountryDest,
                        rec.Pol,
                        rec.Pod,
                        rec.FinalDest,
                        rec.Vessel,
                        rec.Precarriage,
                        rec.PlaceReceipt,
                        rec.DeliveryTerms,
                        rec.PaymentTerms,
                        rec.Incoterms,
                        rec.OtherTerms,
                        rec.MarksNos,
                        rec.GrossNetWt,
                        rec.OtherRef,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
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
                        "SP_SCI_InsertRow",
                        new
                        {
                            SciRecordId = newId,
                            SortOrder = i,
                            row.Description,
                            row.Hs,
                            row.Qty,
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
        public async Task<bool> UpdateAsync(int id, SciRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_SCI_Update",
                    new
                    {
                        Id = id,
                        rec.InvNo,
                        rec.InvDate,
                        rec.ConName,
                        rec.ConAddr1,
                        rec.ConAddr2,
                        rec.ConAddr3,
                        rec.NotName,
                        rec.NotAddr1,
                        rec.NotAddr2,
                        rec.NotAddr3,
                        rec.CountryOrigin,
                        rec.CountryDest,
                        rec.Pol,
                        rec.Pod,
                        rec.FinalDest,
                        rec.Vessel,
                        rec.Precarriage,
                        rec.PlaceReceipt,
                        rec.DeliveryTerms,
                        rec.PaymentTerms,
                        rec.Incoterms,
                        rec.OtherTerms,
                        rec.MarksNos,
                        rec.GrossNetWt,
                        rec.OtherRef,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
                        rec.TotAmt,
                        rec.AmtWords
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old rows and reinsert
                await conn.ExecuteAsync(
                    "SP_SCI_DeleteRows",
                    new { SciRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_SCI_InsertRow",
                        new
                        {
                            SciRecordId = id,
                            SortOrder = i,
                            row.Description,
                            row.Hs,
                            row.Qty,
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
                "SP_SCI_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}