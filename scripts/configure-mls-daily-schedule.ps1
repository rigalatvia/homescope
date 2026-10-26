param(
  [string]$ProjectId = 'homescope-ee781',
  [Parameter(Mandatory = $true)][string]$JobName,
  [string]$Endpoint = 'https://homescopegta.ca/api/internal/mls-sync/scheduled',
  [switch]$Apply
)
$ErrorActionPreference = 'Stop'
# Requires an operator with Scheduler list/get/update/pause/resume permissions.
# Default is read-only. Never print target headers or access tokens.
if ($ProjectId -notmatch '^[a-z][a-z0-9-]+$') { throw 'Invalid project ID.' }
if ($JobName -notmatch "^projects/$ProjectId/locations/[a-z0-9-]+/jobs/[a-zA-Z0-9_-]+$") {
  throw 'JobName must be the existing full projects/.../locations/.../jobs/... resource name.'
}
$gcloud = Get-Command gcloud -ErrorAction Stop
$accessToken = (& $gcloud.Source auth print-access-token --quiet | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $accessToken) { throw 'gcloud authentication failed.' }
$headers = @{ Authorization = "Bearer $accessToken" }
$api = 'https://cloudscheduler.googleapis.com/v1'
function Get-SafeTarget($Target) {
  if (!$Target.uri) { return $null }
  $parsed = [uri]$Target.uri
  return '{0}://{1}{2}' -f $parsed.Scheme, $parsed.Host, $parsed.AbsolutePath
}
function Get-Pages([string]$Url, [string]$Field) {
  $baseUrl = $Url
  do {
    $response = Invoke-RestMethod -Uri $Url -Headers $headers
    foreach ($item in $response.$Field) { $item }
    if ($response.nextPageToken) {
      $separator = if ($baseUrl.Contains('?')) { '&' } else { '?' }
      $Url = $baseUrl + $separator + 'pageToken=' + [uri]::EscapeDataString($response.nextPageToken)
    }
  } while ($response.nextPageToken)
}
function Get-Jobs {
  $locations = @(Get-Pages "$api/projects/$ProjectId/locations" 'locations')
  if (!$locations.Count) { throw 'No Scheduler locations returned; refusing an incomplete inventory.' }
  foreach ($location in $locations) { Get-Pages "$api/$($location.name)/jobs?pageSize=500" 'jobs' }
}
$jobs = @(Get-Jobs)
$mlsJobs = @($jobs | Where-Object { $_.httpTarget -and $_.httpTarget.uri -and $_.httpTarget.uri.TrimEnd('/') -eq $Endpoint.TrimEnd('/') })
$primary = @($mlsJobs | Where-Object name -eq $JobName)
if ($primary.Count -ne 1) { throw 'Selected job is missing or its HTTP target differs from Endpoint.' }
$duplicates = @($mlsJobs | Where-Object { $_.name -ne $JobName -and $_.state -eq 'ENABLED' })
$config = @{
  name = $JobName; schedule = '0 4 * * *'; timeZone = 'America/Toronto'; attemptDeadline = '900s'
  retryConfig = @{ retryCount = 30; maxRetryDuration = '21600s'; minBackoffDuration = '300s'; maxBackoffDuration = '1800s'; maxDoublings = 3 }
}
@{
  mode = $(if ($Apply) { 'apply' } else { 'preview' })
  proposed = $config
  pauseDuplicates = @($duplicates | Select-Object name, schedule, timeZone, state)
  previous = @($primary | Select-Object name, schedule, timeZone, state, attemptDeadline, retryConfig)
  inventory = @($jobs | ForEach-Object { @{ name = $_.name; schedule = $_.schedule; timeZone = $_.timeZone; state = $_.state; uri = Get-SafeTarget $_.httpTarget } })
} | ConvertTo-Json -Depth 8
if (!$Apply) { return }
# Modify only the exact MLS endpoint, preserving all auth headers and unrelated jobs.
foreach ($job in $duplicates) {
  $null = Invoke-RestMethod -Method Post -Uri "$api/$($job.name):pause" -Headers $headers -ContentType 'application/json' -Body '{}'
}
$mask = 'schedule,timeZone,attemptDeadline,retryConfig'
$null = Invoke-RestMethod -Method Patch -Uri "$api/${JobName}?updateMask=$mask" -Headers $headers -ContentType 'application/json' -Body ($config | ConvertTo-Json -Depth 8)
if ($primary[0].state -eq 'PAUSED') {
  $null = Invoke-RestMethod -Method Post -Uri "$api/${JobName}:resume" -Headers $headers -ContentType 'application/json' -Body '{}'
}
$verified = @(Get-Jobs | Where-Object { $_.httpTarget -and $_.httpTarget.uri -and $_.httpTarget.uri.TrimEnd('/') -eq $Endpoint.TrimEnd('/') -and $_.state -eq 'ENABLED' })
if ($verified.Count -ne 1 -or $verified[0].name -ne $JobName -or $verified[0].schedule -ne '0 4 * * *' -or $verified[0].timeZone -ne 'America/Toronto') {
  throw 'Post-update verification failed. Inspect the sanitized inventory and Scheduler console.'
}
'Verified one active job for the MLS endpoint at 04:00 America/Toronto.'
