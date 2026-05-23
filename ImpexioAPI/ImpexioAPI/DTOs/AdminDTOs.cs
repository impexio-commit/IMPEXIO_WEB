namespace ImpexioAPI.DTOs
{
    // ── CUSTOMER DTO ──────────────────────────────────────────
    public class CustomerDto
    {
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
    }

    // ── CUSTOMER USER DTO ─────────────────────────────────────
    public class CustomerUserDto
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public string Password { get; set; } = "";
    }

    public class CustomerUserToggleDto
    {
        public bool IsActive { get; set; }
    }

    // ── SUBSCRIPTION DTO ──────────────────────────────────────
    public class SubscriptionDto
    {
        public int CustomerId { get; set; }
        public int PlanId { get; set; }
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public string PaymentStatus { get; set; } = "Pending";
        public string? Notes { get; set; }
    }

    public class SubscriptionToggleDto
    {
        public bool IsActive { get; set; }
    }
}