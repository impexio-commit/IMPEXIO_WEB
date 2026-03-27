namespace ImpexioAPI.DTOs
{
    // ── What frontend SENDS to API when saving ──
    public class CbmRecordDto
    {
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

        public List<CbmContainerDto> Containers { get; set; } = new();
        public List<CbmItemDto> Items { get; set; } = new();
    }

    // ── Container row data ──
    public class CbmContainerDto
    {
        public string ContainerType { get; set; } = string.Empty;
        public decimal? Cbm { get; set; }
        public decimal? Mt { get; set; }
        public int? Qty { get; set; }
    }

    // ── CBM / CFT item row data ──
    public class CbmItemDto
    {
        public string CalcType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public int? Boxes { get; set; }
        public decimal? Result { get; set; }
    }
}