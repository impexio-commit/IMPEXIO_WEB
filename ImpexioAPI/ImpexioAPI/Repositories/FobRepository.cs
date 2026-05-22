using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class FobRepository
    {
        private readonly DbConnectionFactory _db;

        public FobRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<FobRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<FobRecord>(
                "SP_FOB_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Charges = (await conn.QueryAsync<FobCharge>(
                    "SP_FOB_GetCharges",
                    new { FobRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<FobRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<FobRecord>(
                "SP_FOB_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Charges = (await conn.QueryAsync<FobCharge>(
                "SP_FOB_GetCharges",
                new { FobRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(FobRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_FOB_Insert",
                    new
                    {
                        rec.FobNo,
                        rec.FobDate,
                        rec.Company,
                        rec.Pol,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Cbm20,
                        rec.Cbm40,
                        rec.Cbm40Hq,
                        rec.CbmLcl,
                        rec.Total20,
                        rec.Total40,
                        rec.Total40Hq,
                        rec.TotalLcl
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var charge in rec.Charges)
                {
                    await conn.ExecuteAsync(
                        "SP_FOB_InsertCharge",
                        new
                        {
                            FobRecordId = newId,
                            charge.ChargeKey,
                            charge.Amt20,
                            charge.Amt40,
                            charge.Amt40Hq,
                            charge.AmtLcl
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
        public async Task<bool> UpdateAsync(int id, FobRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_FOB_Update",
                    new
                    {
                        Id = id,
                        rec.FobNo,
                        rec.FobDate,
                        rec.Company,
                        rec.Pol,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Cbm20,
                        rec.Cbm40,
                        rec.Cbm40Hq,
                        rec.CbmLcl,
                        rec.Total20,
                        rec.Total40,
                        rec.Total40Hq,
                        rec.TotalLcl
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old charges and reinsert
                await conn.ExecuteAsync(
                    "SP_FOB_DeleteCharges",
                    new { FobRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                foreach (var charge in rec.Charges)
                {
                    await conn.ExecuteAsync(
                        "SP_FOB_InsertCharge",
                        new
                        {
                            FobRecordId = id,
                            charge.ChargeKey,
                            charge.Amt20,
                            charge.Amt40,
                            charge.Amt40Hq,
                            charge.AmtLcl
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
                "SP_FOB_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}