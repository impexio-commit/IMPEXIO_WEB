namespace ImpexioAPI.Models
{
    public class CbmRecord
    {
        public int Id { get; set; }
        public string CbmNo { get; set; } = string.Empty;
        public DateTime CbmDate { get; set; }
        public string? Company { get; set; }
        public string? Branch { get; set; }
        public string? Location { get; set; }
        public string? DayBook { get; set; }
        public string? ListingNo { get; set; }
        public string? Exporter { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public List<CbmContainerSummary> Containers { get; set; } = new();
        public List<CbmItem> Items { get; set; } = new();
    }
}