namespace ImpexioAPI.Models
{
    // ── OWNER ─────────────────────────────────────────────────
    public class OwnerUser
    {
        public int Id { get; set; }
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    // ── CUSTOMER ──────────────────────────────────────────────
    public class Customer
    {
        public int Id { get; set; }
        public string ClientCode { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string? ContactPerson { get; set; }
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? GSTIN { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Extra fields from JOIN in GetAll
        public string? SubEndDate { get; set; }
        public bool? SubActive { get; set; }
        public string? PlanName { get; set; }
    }

    // ── CUSTOMER USER ─────────────────────────────────────────
    public class CustomerUser
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public string PasswordHash { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }

        // From JOIN
        public string? CompanyName { get; set; }
        public string? ClientCode { get; set; }
        public bool? CustomerActive { get; set; }
    }

    // ── PLAN ──────────────────────────────────────────────────
    public class Plan
    {
        public int Id { get; set; }
        public string PlanName { get; set; } = "";
        public int DurationMonths { get; set; }
        public decimal Price { get; set; }
        public int MaxUsers { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }

    // ── SUBSCRIPTION ──────────────────────────────────────────
    public class Subscription
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int PlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
        public string PaymentStatus { get; set; } = "Pending";
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // From JOIN
        public string? PlanName { get; set; }
        public int? DurationMonths { get; set; }
        public decimal? Price { get; set; }
    }

    // ── AUTH MODELS ───────────────────────────────────────────
    public class AdminLoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class AdminLoginResponse
    {
        public string Token { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "";
        public string? ClientCode { get; set; }
        public string? CompanyName { get; set; }
        public DateTime Expiry { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
        public string ConfirmPassword { get; set; } = "";
    }
}