public class CustomField
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text, number, select, date, boolean
    public string? Options { get; set; } // JSON string for select options
    public DateTime CreatedAt { get; set; }
}