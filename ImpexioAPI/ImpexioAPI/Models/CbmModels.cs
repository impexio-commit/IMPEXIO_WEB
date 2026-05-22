namespace ImpexioAPI.Models
{
    public class CbmRecord
    {
        public int Id { get; set; }
        public string CbmNo { get; set; } = "";
        public DateTime CbmDate { get; set; }
        public string? DayBook { get; set; }
        public string? ListingNo { get; set; }
        public string? Exporter { get; set; }
        public string? Company { get; set; }
        public string? Branch { get; set; }
        public string? Location { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? Remarks { get; set; }
        public decimal TotalCbm { get; set; }
        public decimal TotalCft { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<CbmItem> Items { get; set; } = new();
        public List<CbmContainerSummary> Containers { get; set; } = new();
    }

    public class CbmItem
    {
        public int Id { get; set; }
        public int CbmRecordId { get; set; }
        public string CalcType { get; set; } = "CBM";
        public string? Description { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Boxes { get; set; }
        public decimal? Result { get; set; }
        public int SortOrder { get; set; }
    }

    public class CbmContainerSummary
    {
        public int Id { get; set; }
        public int CbmRecordId { get; set; }
        public string ContainerType { get; set; } = "";
        public decimal Cbm { get; set; }
        public decimal Mt { get; set; }
        public decimal Qty { get; set; }
    }
}