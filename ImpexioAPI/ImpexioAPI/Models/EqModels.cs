namespace ImpexioAPI.Models
{
    public class EqRecord
    {
        public int Id { get; set; }
        public string QuotNo { get; set; } = "";
        public DateTime QuotDate { get; set; }
        public string? Product { get; set; }
        public string? Buyer { get; set; }
        public string? Country { get; set; }
        public string? Pol { get; set; }
        public string? Pod { get; set; }
        public string? Incoterms { get; set; }
        public string? FinalDest { get; set; }
        public string? DeliveryTime { get; set; }
        public string? ShipmentType { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Validity { get; set; }
        public string? Packaging { get; set; }
        public string? ContainerSize { get; set; }
        public string? PackedDim { get; set; }
        public string? InnerPack { get; set; }
        public string? PackedWeight { get; set; }
        public string? MasterPack { get; set; }
        public string? Sample { get; set; }
        public string? SpecialInst { get; set; }
        public string? OtherDesc { get; set; }
        public string? Remarks { get; set; }
        public string? PreparedBy { get; set; }
        public string? Signatory { get; set; }
        public string? TotQty { get; set; }
        public string? TotAmt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Child rows loaded separately
        public List<EqRow> Rows { get; set; } = new();
    }

    public class EqRow
    {
        public int Id { get; set; }
        public int EqRecordId { get; set; }
        public int SortOrder { get; set; }
        public string? Desc { get; set; }
        public string? Hs { get; set; }
        public string? Qty { get; set; }
        public string? Rate { get; set; }
        public string? Amt { get; set; }
    }
}