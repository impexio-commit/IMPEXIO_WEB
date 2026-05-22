using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class IleRepository
    {
        private readonly DbConnectionFactory _db;

        public IleRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── GET ALL ──────────────────────────────────────────
        public async Task<List<IleRecord>> GetAllAsync()
        {
            using var conn = _db.CreateConnection();

            var records = (await conn.QueryAsync<IleRecord>(
                "SP_ILE_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var rec in records)
            {
                rec.Rows = (await conn.QueryAsync<IleRow>(
                    "SP_ILE_GetRows",
                    new { IleRecordId = rec.Id },
                    commandType: CommandType.StoredProcedure)).ToList();
            }

            return records;
        }

        // ── GET BY ID ────────────────────────────────────────
        public async Task<IleRecord?> GetByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();

            var record = await conn.QueryFirstOrDefaultAsync<IleRecord>(
                "SP_ILE_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (record == null) return null;

            record.Rows = (await conn.QueryAsync<IleRow>(
                "SP_ILE_GetRows",
                new { IleRecordId = id },
                commandType: CommandType.StoredProcedure)).ToList();

            return record;
        }

        // ── INSERT ───────────────────────────────────────────
        public async Task<int> InsertAsync(IleRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var newId = await conn.QuerySingleAsync<int>(
                    "SP_ILE_Insert",
                    new
                    {
                        rec.RefNo,
                        rec.RefDate,
                        rec.ResponseBy,
                        rec.FromCompany,
                        rec.FromContact,
                        rec.FromDesig,
                        rec.FromAddr,
                        rec.FromEmail,
                        rec.FromPhone,
                        rec.SupName,
                        rec.SupContact,
                        rec.SupCountry,
                        rec.SupAddr,
                        rec.SupEmail,
                        rec.SupWebsite,
                        rec.Pod,
                        rec.Incoterms,
                        rec.Container,
                        rec.DeliveryBy,
                        rec.Coo,
                        rec.PriceBasis,
                        rec.PaymentTerms,
                        rec.Currency,
                        rec.Moq,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Checklist
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                // Insert product rows
                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_ILE_InsertRow",
                        new
                        {
                            IleRecordId = newId,
                            SortOrder = i,
                            row.Description,
                            row.Hs,
                            row.Qty,
                            row.Unit,
                            row.Spec
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
        public async Task<bool> UpdateAsync(int id, IleRecord rec)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                var rows = await conn.ExecuteAsync(
                    "SP_ILE_Update",
                    new
                    {
                        Id = id,
                        rec.RefNo,
                        rec.RefDate,
                        rec.ResponseBy,
                        rec.FromCompany,
                        rec.FromContact,
                        rec.FromDesig,
                        rec.FromAddr,
                        rec.FromEmail,
                        rec.FromPhone,
                        rec.SupName,
                        rec.SupContact,
                        rec.SupCountry,
                        rec.SupAddr,
                        rec.SupEmail,
                        rec.SupWebsite,
                        rec.Pod,
                        rec.Incoterms,
                        rec.Container,
                        rec.DeliveryBy,
                        rec.Coo,
                        rec.PriceBasis,
                        rec.PaymentTerms,
                        rec.Currency,
                        rec.Moq,
                        rec.Remarks,
                        rec.PreparedBy,
                        rec.Signatory,
                        rec.Checklist
                    },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                if (rows == 0) { tx.Rollback(); return false; }

                // Delete old rows and reinsert
                await conn.ExecuteAsync(
                    "SP_ILE_DeleteRows",
                    new { IleRecordId = id },
                    transaction: tx,
                    commandType: CommandType.StoredProcedure);

                for (int i = 0; i < rec.Rows.Count; i++)
                {
                    var row = rec.Rows[i];
                    await conn.ExecuteAsync(
                        "SP_ILE_InsertRow",
                        new
                        {
                            IleRecordId = id,
                            SortOrder = i,
                            row.Description,
                            row.Hs,
                            row.Qty,
                            row.Unit,
                            row.Spec
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
                "SP_ILE_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
    }
}