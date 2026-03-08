# Check all lessons in module 2
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndmF2c2lyZW96a3NpcWpsZXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc0NzU2MSwiZXhwIjoyMDg2MzIzNTYxfQ.WGW7juee-Vw_1f-hCV2M_4o8epf-mSh-M8XuTx7pgHA"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndmF2c2lyZW96a3NpcWpsZXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc0NzU2MSwiZXhwIjoyMDg2MzIzNTYxfQ.WGW7juee-Vw_1f-hCV2M_4o8epf-mSh-M8XuTx7pgHA"
    "Content-Type" = "application/json"
}

$lessons = Invoke-RestMethod -Uri "https://sgvavsireozksiqjlewh.supabase.co/rest/v1/lessons?module_id=eq.2&order=order_index" -Method Get -Headers $headers
Write-Host "Lessons in module 2:"
foreach ($l in $lessons) {
    Write-Host "ID $($l.id) | order: $($l.order_index) | published: $($l.is_published) | $($l.title)"
}
