namespace ImpexioAPI.DTOs
{
    public class Ec2RecordDto
    {
        public string RefNo { get; set; } = "";
        public string RateDate { get; set; } = "";
        public string? Company { get; set; }
        public string? Product { get; set; }
        public string? UsdRate { get; set; }
        public string? Pol { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? SumFobInr { get; set; }
        public string? SumFobUsd { get; set; }
        public string? SumCifInr { get; set; }

        public List<Ec2CellDto> Cells { get; set; } = new();
    }

    public class Ec2CellDto
    {
        public string RowKey { get; set; } = "";
        public string ColId { get; set; } = "";
        public decimal Value { get; set; }
    }
}