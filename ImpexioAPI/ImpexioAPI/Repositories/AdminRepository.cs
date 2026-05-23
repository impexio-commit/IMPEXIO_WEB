using Dapper;
using ImpexioAPI.Models;
using System.Data;

namespace ImpexioAPI.Repositories
{
    public class AdminRepository
    {
        private readonly DbConnectionFactory _db;

        public AdminRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        // ── OWNER ─────────────────────────────────────────────
        public async Task<OwnerUser?> GetOwnerByEmailAsync(string email)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<OwnerUser>(
                "SP_Owner_GetByEmail",
                new { Email = email },
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateOwnerPasswordAsync(int id, string hash)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_Owner_UpdatePassword",
                new { Id = id, PasswordHash = hash },
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateOwnerLastLoginAsync(int id)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_Owner_UpdateLastLogin",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        // ── CUSTOMERS ─────────────────────────────────────────
        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<Customer>(
                "SP_Customer_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();
        }

        public async Task<Customer?> GetCustomerByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<Customer>(
                "SP_Customer_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> InsertCustomerAsync(Customer c)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "SP_Customer_Insert",
                new
                {
                    c.ClientCode,
                    c.CompanyName,
                    c.ContactPerson,
                    c.Email,
                    c.Phone,
                    c.Address,
                    c.City,
                    c.State,
                    c.Country,
                    c.GSTIN
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateCustomerAsync(int id, Customer c)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_Customer_Update",
                new
                {
                    Id = id,
                    c.CompanyName,
                    c.ContactPerson,
                    c.Email,
                    c.Phone,
                    c.Address,
                    c.City,
                    c.State,
                    c.Country,
                    c.GSTIN,
                    c.IsActive
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task DeleteCustomerAsync(int id)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_Customer_Delete",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        // ── CUSTOMER USERS ────────────────────────────────────
        public async Task<CustomerUser?> GetCustomerUserByEmailAsync(string email)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<CustomerUser>(
                "SP_CustUser_GetByEmail",
                new { Email = email },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<List<CustomerUser>> GetCustomerUsersByCustomerAsync(int customerId)
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<CustomerUser>(
                "SP_CustUser_GetByCustomerId",
                new { CustomerId = customerId },
                commandType: CommandType.StoredProcedure)).ToList();
        }

        public async Task<int> InsertCustomerUserAsync(CustomerUser u)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "SP_CustUser_Insert",
                new
                {
                    u.CustomerId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.PasswordHash
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateCustomerUserPasswordAsync(int id, string hash)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_CustUser_UpdatePassword",
                new { Id = id, PasswordHash = hash },
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateCustomerUserLastLoginAsync(int id)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_CustUser_UpdateLastLogin",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task ToggleCustomerUserAsync(int id, bool isActive)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_CustUser_ToggleActive",
                new { Id = id, IsActive = isActive },
                commandType: CommandType.StoredProcedure);
        }

        // ── PLANS ─────────────────────────────────────────────
        public async Task<List<Plan>> GetAllPlansAsync()
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<Plan>(
                "SP_Plan_GetAll",
                commandType: CommandType.StoredProcedure)).ToList();
        }

        public async Task<Plan?> GetPlanByIdAsync(int id)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<Plan>(
                "SP_Plan_GetById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        // ── SUBSCRIPTIONS ─────────────────────────────────────
        public async Task<List<Subscription>> GetSubscriptionsByCustomerAsync(int customerId)
        {
            using var conn = _db.CreateConnection();
            return (await conn.QueryAsync<Subscription>(
                "SP_Sub_GetByCustomer",
                new { CustomerId = customerId },
                commandType: CommandType.StoredProcedure)).ToList();
        }

        public async Task<Subscription?> GetActiveSubscriptionAsync(int customerId)
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<Subscription>(
                "SP_Sub_GetActive",
                new { CustomerId = customerId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> InsertSubscriptionAsync(Subscription s)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "SP_Sub_Insert",
                new
                {
                    s.CustomerId,
                    s.PlanId,
                    s.StartDate,
                    s.EndDate,
                    s.IsActive,
                    s.PaymentStatus,
                    s.Notes
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task ToggleSubscriptionAsync(int id, bool isActive)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "SP_Sub_ToggleActive",
                new { Id = id, IsActive = isActive },
                commandType: CommandType.StoredProcedure);
        }
    }
}