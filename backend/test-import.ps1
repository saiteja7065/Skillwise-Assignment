$filePath = "sample-products.csv"
$url = "http://localhost:5000/api/products/import"

$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))
$fileContent = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"csvFile`"; filename=`"sample-products.csv`"",
    "Content-Type: text/csv$LF",
    $fileContent,
    "--$boundary--$LF"
) -join $LF

$response = Invoke-RestMethod -Uri $url -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines

Write-Output $response
