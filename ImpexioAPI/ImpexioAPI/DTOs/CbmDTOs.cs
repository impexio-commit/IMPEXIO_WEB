namespace ImpexioAPI.DTOs
{
    public class CbmRecordDto
    {
        public string CbmNo { get; set; } = "";
        public string CbmDate { get; set; } = "";
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

        public List<CbmItemDto> Items { get; set; } = new();
        public List<CbmContainerSummaryDto> Containers { get; set; } = new();
    }

    public class CbmItemDto
    {
        public string CalcType { get; set; } = "CBM";
        public string? Description { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Boxes { get; set; }
        public decimal? Result { get; set; }
        public int SortOrder { get; set; }
    }

    public class CbmContainerSummaryDto
    {
        public string ContainerType { get; set; } = "";
        public decimal Cbm { get; set; }
        public decimal Mt { get; set; }
        public decimal Qty { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string msg = "Success")
            => new() { Success = true, Message = msg, Data = data };

        public static ApiResponse<T> Fail(string msg)
            => new() { Success = false, Message = msg };
    }
}