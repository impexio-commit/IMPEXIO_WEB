namespace ImpexioAPI.Models
{
    public class Ec2Record
    {
        public int Id { get; set; }
        public string RefNo { get; set; } = "";
        public DateTime RateDate { get; set; }
        public string? Company { get; set; }
        public string? Product { get; set; }
        public string? UsdRate { get; set; }
        public string? Pol { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? SumFobInr { get; set; }
        public string? SumFobUsd { get; set; }
        public string? SumCifInr { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Child rows loaded separately
        public List<Ec2Cell> Cells { get; set; } = new();
    }

    public class Ec2Cell
    {
        public int Id { get; set; }
        public int Ec2RecordId { get; set; }
        public string RowKey { get; set; } = "";
        public string ColId { get; set; } = "";
        public decimal Value { get; set; }
    }
}