using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class EqRepository
    {
        private readonly DbConnectionFactory _db;

        public EqRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<EqRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<EqRecord>(
                "SP_EQ_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Rows = (await conn.QueryAsync<EqRow>(
                    "SP_EQ_GetRows",
                    new { EqRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<EqRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<EqRecord>(
                "SP_EQ_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Rows = (await conn.QueryAsync<EqRow>(
                "SP_EQ_GetRows",
                new { EqRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(EqRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_EQ_Insert",
                    new
                    {
                        rec.QuotNo,
                        rec.QuotDate,
                        rec.Product,
                        rec.Buyer,
                        rec.Country,
                        rec.Pol,
                        rec.Pod,
                        rec.Incoterms,
                        rec.FinalDest,
                        rec.DeliveryTime,
                        rec.ShipmentType,
                        rec.PaymentTerms,
                        rec.Validity,
                        rec.Packaging,
                        rec.ContainerSize,
                        rec.PackedDim,
                        rec.InnerPack,
                        rec.PackedWeight,
                        rec.MasterPack,
                        rec.Sample,
                        rec.SpecialInst,
                        rec.OtherDesc,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
                        rec.TotAmt
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                // Insert product rows
                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_EQ_InsertRow",
                        new
                        {
                            EqRecordId = newId,
                            SortOrder = i,
                            row.Desc,
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
        public async Task<bool> UpdateAsync(int id, EqRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_EQ_Update",
                    new
                    {
                        Id = id,
                        rec.QuotNo,
                        rec.QuotDate,
                        rec.Product,
                        rec.Buyer,
                        rec.Country,
                        rec.Pol,
                        rec.Pod,
                        rec.Incoterms,
                        rec.FinalDest,
                        rec.DeliveryTime,
                        rec.ShipmentType,
                        rec.PaymentTerms,
                        rec.Validity,
                        rec.Packaging,
                        rec.ContainerSize,
                        rec.PackedDim,
                        rec.InnerPack,
                        rec.PackedWeight,
                        rec.MasterPack,
                        rec.Sample,
                        rec.SpecialInst,
                        rec.OtherDesc,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.TotQty,
                        rec.TotAmt
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old rows and reinsert
                await conn.ExecuteAsync(
                    "SP_EQ_DeleteRows",
                    new { EqRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_EQ_InsertRow",
                        new
                        {
                            EqRecordId = id,
                            SortOrder = i,
                            row.Desc,
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
                "SP_EQ_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}