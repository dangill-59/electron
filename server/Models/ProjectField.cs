namespace DocumentDmsServer.Models
{
    public class ProjectField
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // text, number, date, list
        public string? ListOptions { get; set; } // comma-separated for list type
    }
}